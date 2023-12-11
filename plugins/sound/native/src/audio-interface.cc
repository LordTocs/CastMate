#include "audio-interface.hh"
#include "util.hh"

#include <string>
#include <sstream>
#include <iomanip>
#include <iostream>

using namespace Microsoft::WRL;

Napi::Object audio_device_interface::init(Napi::Env env, Napi::Object exports)
{
    Napi::Function constructor = DefineClass(env, "NativeAudioDeviceInterface", {
        InstanceMethod("getDevices", &audio_device_interface::get_devices),
        InstanceMethod("getDefaultOutput", &audio_device_interface::get_default_output),
        InstanceMethod("getDefaultInput", &audio_device_interface::get_default_input),
    });

    exports.Set("NativeAudioDeviceInterface", constructor);
    return exports;  
}

audio_device_interface::audio_device_interface(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<audio_device_interface>(info)
{
    emit = info[0].As<Napi::Function>();
    
    Napi::Env env = info.Env();
    HRESULT hr;
    hr = ::CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(device_enum.ReleaseAndGetAddressOf()));
    if (error_handler(hr, "Unable to create enumerator", env))
    {
        return;
    }

    (*notifier.GetAddressOf()) = new audio_device_notifier(env, this);
    notifier->AddRef();

    device_enum->RegisterEndpointNotificationCallback(notifier.Get());
}

static HRESULT get_data_flow(IMMDevice* device, EDataFlow *data_flow)
{
    ComPtr<IMMEndpoint> endpoint;
    HRESULT hr = device->QueryInterface(__uuidof(IMMEndpoint), (void**)endpoint.ReleaseAndGetAddressOf());
    if (hr != S_OK) return hr;
    hr = endpoint->GetDataFlow(data_flow);
    if (hr != S_OK) return hr;
    return S_OK;
}

static Napi::Value get_js_device(IMMDevice* device, Napi::Env env)
{
    if (device == nullptr) return env.Undefined();

    HRESULT hr;
    ComPtr<IPropertyStore> device_properties;
    hr = device->OpenPropertyStore(STGM_READ, device_properties.ReleaseAndGetAddressOf());
    if (error_handler_offthread(hr, "Unable to get audio device properties"))
    {
        return env.Undefined();
    }

    LPWSTR device_id_ptr;
    device->GetId(&device_id_ptr);
    std::wstring id(device_id_ptr);
    ::CoTaskMemFree(device_id_ptr);

    PROPVARIANT device_name_var;
    PropVariantInit(&device_name_var);

    hr = device_properties->GetValue(PKEY_Device_FriendlyName, &device_name_var);
    if (error_handler_offthread(hr, "Unable to get audio device name"))
    {
        return env.Undefined();
    }
    std::wstring wname(device_name_var.pwszVal);

    hr = device_properties->GetValue(PKEY_AudioEndpoint_GUID, &device_name_var);
    if (error_handler_offthread(hr, "Unable to get audio device name"))
    {
        return env.Undefined();
    }
    std::wstring wguid(device_name_var.pwszVal);

    EDataFlow flow;
    hr = get_data_flow(device, &flow);
    if (error_handler_offthread(hr, "Unable to get audio device data flow"))
    {
        return env.Undefined();
    }

    DWORD state;
    hr = device->GetState(&state);
    if (error_handler_offthread(hr, "Unable to get audio device state"))
    {
        return env.Undefined();
    }

    Napi::Object device_obj = Napi::Object::New(env);
    device_obj.Set("id", Napi::String::New(env, std::u16string(id.begin(), id.end())));
    device_obj.Set("type", Napi::String::New(env, flow == eRender ? "output" : "input"));
   

    Napi::String state_str;

    if (state == DEVICE_STATE_ACTIVE) {
        state_str = Napi::String::New(env, "active");
    }
    else if (state == DEVICE_STATE_DISABLED) {
        state_str = Napi::String::New(env, "disabled");
    } else if (state == DEVICE_STATE_NOTPRESENT) {
        state_str = Napi::String::New(env, "not_present");
    } else if (state == DEVICE_STATE_UNPLUGGED) {
        state_str = Napi::String::New(env, "unplugged");
    } else {
        state_str = Napi::String::New(env, "unknown");
    }

    device_obj.Set("state", state_str);
    device_obj.Set("name", Napi::String::New(env, std::u16string(wname.begin(), wname.end())));
    device_obj.Set("guid", Napi::String::New(env, std::u16string(wguid.begin(), wguid.end())));
    return device_obj;
}

Napi::Value audio_device_interface::get_devices(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    HRESULT hr;

    ComPtr<IMMDeviceCollection> devices;
    hr = device_enum->EnumAudioEndpoints(eAll, DEVICE_STATEMASK_ALL, devices.ReleaseAndGetAddressOf());
    if (error_handler(hr, "Unable to get audio device collection", env))
    {
        return env.Undefined();
    }

    UINT device_count = 0;
    hr = devices->GetCount(&device_count);
    if (error_handler(hr, "Unable to get audio device collection count", env))
    {
        return env.Undefined();
    }

    Napi::Array result = Napi::Array::New(env);
    int result_count = 0;
    for (unsigned int i = 0; i < device_count; ++i)
    {
        ComPtr<IMMDevice> device;
        hr = devices->Item(i, device.ReleaseAndGetAddressOf());
        if (error_handler(hr, "Unable to get audio device out of collection", env))
        {
            return env.Undefined();
        }

        Napi::Value device_obj = get_js_device(device.Get(), env);
        if (device_obj.IsUndefined()) continue;

        result[result_count++] = device_obj;
    }

    return result;
}

Napi::Value audio_device_interface::get_default_output(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    HRESULT hr;

    if (info.Length() < 1)
    {
        Napi::Error::New(env, "getDefaultDevice requires a string argument.").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    Napi::String type_str = info[0].As<Napi::String>();

    ComPtr<IMMDevice> device;
    std::string type = type_str.Utf8Value();
    if (type == "main")
    {
        hr = device_enum->GetDefaultAudioEndpoint(eRender, eMultimedia, device.ReleaseAndGetAddressOf());
    }
    else if (type == "chat")
    {
        hr = device_enum->GetDefaultAudioEndpoint(eRender, eCommunications, device.ReleaseAndGetAddressOf());
    }

    if (error_handler(hr, "Failed to get default output", env))
    {
        return env.Undefined();
    }

    Napi::Value device_obj = get_js_device(device.Get(), env);
    return device_obj;
}

Napi::Value audio_device_interface::get_default_input(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    HRESULT hr;

    if (info.Length() < 1)
    {
        Napi::Error::New(env, "getDefaultDevice requires a string argument.").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    Napi::String type_str = info[0].As<Napi::String>();

    ComPtr<IMMDevice> device;
    std::string type = type_str.Utf8Value();
    if (type == "main")
    {
        hr = device_enum->GetDefaultAudioEndpoint(eCapture, eMultimedia, device.ReleaseAndGetAddressOf());
    }
    else if (type == "chat")
    {
        hr = device_enum->GetDefaultAudioEndpoint(eCapture, eCommunications, device.ReleaseAndGetAddressOf());
    }

    if (error_handler(hr, "Failed to get default input", env))
    {
        return env.Undefined();
    }

    Napi::Value device_obj = get_js_device(device.Get(), env);
    return device_obj;
}

HRESULT audio_device_interface::get_device_by_id(LPCWSTR id, IMMDevice** pDevice)
{
    HRESULT hr;
    (*pDevice) = nullptr;

    ComPtr<IMMDeviceCollection> devices;
    hr = device_enum->EnumAudioEndpoints(eAll, DEVICE_STATEMASK_ALL, devices.ReleaseAndGetAddressOf());
    if (hr != S_OK) { return hr; }

    UINT device_count = 0;
    hr = devices->GetCount(&device_count);
    if (hr != S_OK) { return hr; }

    for (unsigned int i = 0; i < device_count; ++i)
    {
        ComPtr<IMMDevice> device;
        hr = devices->Item(i, device.ReleaseAndGetAddressOf());

        LPWSTR device_id_ptr;
        device->GetId(&device_id_ptr);

        if (wcscmp(id, device_id_ptr) == 0)
        {
            ::CoTaskMemFree(device_id_ptr);
            (*pDevice) = device.Get();
            device->AddRef();
            return NOERROR;
        }
        
        ::CoTaskMemFree(device_id_ptr);
    }
    return NOERROR;
}

void audio_device_interface::Finalize(Napi::Env env)
{
    device_enum->UnregisterEndpointNotificationCallback(notifier.Get());
    notifier.Reset();
}

void audio_device_notifier::finalizer(Napi::Env env, void* data, audio_device_notifier* context)
{
    //Finally delete the context here now that both COM and v8 are done with it.
    delete context;
}

audio_device_notifier::audio_device_notifier(Napi::Env env, audio_device_interface* device_interface)
    : tsfn(Napi::ThreadSafeFunction::New(env,
        device_interface->emit,
        "AudioDeviceNotifierCallback",
        0,
        1,
        this,
        finalizer,
        (void*)nullptr
    ))
    , device_interface(device_interface)
{
}

HRESULT audio_device_notifier::OnDefaultDeviceChanged(EDataFlow flow, ERole role, LPCWSTR pwstrDefaultDeviceId)
{
    ComPtr<IMMDevice> device;
    device_interface->get_device_by_id(pwstrDefaultDeviceId, device.ReleaseAndGetAddressOf());

    if (!device) {
        return NOERROR;
    }

    auto js_thread_callback = [=](Napi::Env env, Napi::Function js_callback, IMMDevice* device_ptr)
    {

        HRESULT hr;
        //Use a smart pointer so we get auto-release
        ComPtr<IMMDevice> device;
        (*device.ReleaseAndGetAddressOf()) = device_ptr;

        if (env == nullptr || js_callback == nullptr) return;

        Napi::Value js_device = get_js_device(device.Get(), env);

        Napi::String type_str;

        if (role == eCommunications)
        {
            type_str = Napi::String::New(env, "chat");
        }
        else if (role == eMultimedia)
        {
            type_str = Napi::String::New(env, "main");
        }
        else
        {
            return;
        }

        if (flow == eRender)
        {
            js_callback.Call({Napi::String::New(env, "default-output-changed"), type_str, js_device});
        }
        else if (flow == eCapture)
        {
            js_callback.Call({Napi::String::New(env, "default-input-changed"), type_str, js_device});
        }
    };

    device->AddRef();
    tsfn.NonBlockingCall(device.Get(), js_thread_callback);

    return NOERROR;
}

HRESULT audio_device_notifier::OnDeviceAdded(LPCWSTR pwstrDeviceId)
{
    ComPtr<IMMDevice> device;
    device_interface->get_device_by_id(pwstrDeviceId, device.ReleaseAndGetAddressOf());

    if (!device) {
        return NOERROR;
    }

    auto js_thread_callback = [](Napi::Env env, Napi::Function js_callback, IMMDevice* device_ptr)
    {
        HRESULT hr;
        //Use a smart pointer so we get auto-release
        ComPtr<IMMDevice> device;
        (*device.ReleaseAndGetAddressOf()) = device_ptr;

        //env might be null if the tsfn is aborted
        if (env == nullptr || js_callback == nullptr) return;

        Napi::Value js_device = get_js_device(device.Get(), env);

        js_callback.Call({Napi::String::New(env, "device-added"), js_device});

    };

    device->AddRef();
    tsfn.NonBlockingCall(device.Get(), js_thread_callback);

    return NOERROR;
}

HRESULT audio_device_notifier::OnDeviceRemoved(LPCWSTR pwstrDeviceId)
{
    std::wstring* id_str = new std::wstring(pwstrDeviceId);

    auto js_thread_callback = [](Napi::Env env, Napi::Function js_callback, std::wstring* id_ptr)
    {
        std::unique_ptr<std::wstring> id(id_ptr);
        HRESULT hr;
        //env might be null if the tsfn is aborted
        if (env == nullptr || js_callback == nullptr) return;

        js_callback.Call({Napi::String::New(env, "device-removed"), Napi::String::New(env, std::u16string(id->begin(), id->end()))});
    };

    tsfn.NonBlockingCall(id_str, js_thread_callback);
    return NOERROR;
}

HRESULT audio_device_notifier::OnDeviceStateChanged(LPCWSTR pwstrDeviceId, DWORD dwNewState)
{
    ComPtr<IMMDevice> device;
    device_interface->get_device_by_id(pwstrDeviceId, device.ReleaseAndGetAddressOf());

    if (!device) {
        return NOERROR;
    }

     auto js_thread_callback = [](Napi::Env env, Napi::Function js_callback, IMMDevice* device_ptr)
    {
        HRESULT hr;
        //Use a smart pointer so we get auto-release
        ComPtr<IMMDevice> device;
        (*device.ReleaseAndGetAddressOf()) = device_ptr;

        //env might be null if the tsfn is aborted
        if (env == nullptr || js_callback == nullptr) return;

        Napi::Value js_device = get_js_device(device.Get(), env);

        js_callback.Call({Napi::String::New(env, "device-changed"), js_device});
    };

    device->AddRef();
    tsfn.NonBlockingCall(device.Get(), js_thread_callback);

    return NOERROR;
}

HRESULT audio_device_notifier::OnPropertyValueChanged(LPCWSTR pwstrDeviceId, const PROPERTYKEY key)
{
    if (key != PKEY_Device_FriendlyName && key != PKEY_Device_DeviceDesc) return NOERROR;

    ComPtr<IMMDevice> device;
    device_interface->get_device_by_id(pwstrDeviceId, device.ReleaseAndGetAddressOf());

    if (!device) {
        return NOERROR;
    }

    auto js_thread_callback = [](Napi::Env env, Napi::Function js_callback, IMMDevice* device_ptr)
    {
        HRESULT hr;
        //Use a smart pointer so we get auto-release
        ComPtr<IMMDevice> device;
        (*device.ReleaseAndGetAddressOf()) = device_ptr;

        //env might be null if the tsfn is aborted
        if (env == nullptr || js_callback == nullptr) return;

        Napi::Value js_device = get_js_device(device.Get(), env);

        js_callback.Call({Napi::String::New(env, "device-changed"), js_device});
    };

    device->AddRef();
    tsfn.NonBlockingCall(device.Get(), js_thread_callback);

    return NOERROR;
}


//See: https://learn.microsoft.com/en-us/office/client-developer/outlook/mapi/implementing-iunknown-in-c-plus-plus
ULONG audio_device_notifier::AddRef()
{
    InterlockedIncrement(&ref_count);
    return ref_count;
}

ULONG audio_device_notifier::Release()
{
    ULONG ulRefCount = InterlockedDecrement(&ref_count);
    if (0 == ref_count)
    {
        //delete this;
        //Instead of deleting here, tell the threaded system we're done with it.
        tsfn.Release();
    }
    return ulRefCount;
}

HRESULT audio_device_notifier::QueryInterface(REFIID riid, void **ppvObject) 
{
    if (!ppvObject)
        return E_INVALIDARG;
    *ppvObject = nullptr;

    if (riid == IID_IUnknown || riid == __uuidof(IMMNotificationClient))
    {
        (*ppvObject) = static_cast<void*>(this);
        AddRef();
        return NOERROR;
    }
    return E_NOINTERFACE;
}
