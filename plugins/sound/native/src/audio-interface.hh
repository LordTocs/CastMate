#include <napi.h>

#include <initguid.h>
#include <comdef.h>
#include <wrl.h>
#include <propvarutil.h>
#include <mmdeviceapi.h>
#include <functiondiscoverykeys_devpkey.h>

class audio_device_interface;
class audio_device_notifier : public IMMNotificationClient
{
    long volatile ref_count = 0;
    audio_device_interface* device_interface;
public:
    audio_device_notifier(Napi::Env env, class audio_device_interface* device_interface);

    //IMMNotificationClient
    HRESULT OnDefaultDeviceChanged(EDataFlow flow, ERole role, LPCWSTR pwstrDefaultDeviceId) override;
    HRESULT OnDeviceAdded(LPCWSTR pwstrDeviceId) override;
    HRESULT OnDeviceRemoved(LPCWSTR pwstrDeviceId) override;
    HRESULT OnDeviceStateChanged(LPCWSTR pwstrDeviceId, DWORD dwNewState) override;
    HRESULT OnPropertyValueChanged(LPCWSTR pwstrDeviceId, const PROPERTYKEY key) override;

    //IUNKNOWN
    ULONG AddRef() override;
    ULONG Release() override;
    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void **ppvObject) override;

    Napi::ThreadSafeFunction tsfn;

    static void finalizer(Napi::Env env, void* data, audio_device_notifier* context);
};

class audio_device_interface : public Napi::ObjectWrap<audio_device_interface>
{
public:
    static Napi::Object init(Napi::Env env, Napi::Object exports);

     audio_device_interface(const Napi::CallbackInfo& info);

    Napi::Value get_devices(const Napi::CallbackInfo& info);
    Napi::Value get_default_output(const Napi::CallbackInfo& info);
    Napi::Value get_default_input(const Napi::CallbackInfo& info);

    void Finalize(Napi::Env env) override;

    friend class audio_device_notifier;

    HRESULT get_device_by_id(LPCWSTR id, IMMDevice** pDevice);
private:
    Napi::Function emit;
    Microsoft::WRL::ComPtr<IMMDeviceEnumerator> device_enum;
    Microsoft::WRL::ComPtr<audio_device_notifier> notifier;
};
