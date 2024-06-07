#include "util.hh"

#include <string>
#include <sstream>
#include <iomanip>
#include <iostream>

#include <initguid.h>
#include <comdef.h>
#include <wrl.h>
#include <propvarutil.h>
#include <mmdeviceapi.h>
#include <functiondiscoverykeys_devpkey.h>

#include "util.hh"
#include "audio-interface.hh"
#include "tts-interface.hh"

using namespace Microsoft::WRL;

class com_thread_init {
    bool needs_uninit = false;
public:
    com_thread_init()
    {
        HRESULT hr;
    #ifdef _WIN32_WCE
        hr = ::CoInitializeEx(NULL, COINIT_MULTITHREADED);
    #else
        hr = ::CoInitialize(NULL);
    #endif
        needs_uninit = hr == S_OK;
    }

    ~com_thread_init() {
        if (needs_uninit)
        {
            ::CoUninitialize();
        }
    }
};

class instance_data
{
    com_thread_init com_thread_handler;
public:
    instance_data(Napi::Env env) {
    }

    ~instance_data() {

    }
};


Napi::Object Init(Napi::Env env, Napi::Object exports) {  
    //New up some instance data, it will be deleted when the module is unloaded.
    env.SetInstanceData<instance_data>(new instance_data(env));

    audio_device_interface::init(env, exports);
    os_tts_interface::init(env, exports);

    return exports;
}

NODE_API_MODULE(castmate_plugin_sound_native, Init)