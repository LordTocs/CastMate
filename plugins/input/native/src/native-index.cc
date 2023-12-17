#include <uv.h> //ABI Stability questions go here...

#include <string>
#include <sstream>
#include <iomanip>
#include <iostream>

#include "input-interface.hh"

class uv_message_pump
{
    uv_idle_t idle;
public:
    uv_message_pump(Napi::Env env)
    {
        uv_loop_s* loop;
        napi_get_uv_event_loop(env, &loop);
        uv_idle_init(loop, &idle);
        uv_idle_start(&idle, &uv_message_pump::message_pump);
    }

    ~uv_message_pump()
    {
        uv_idle_stop(&idle);
    }

    static void message_pump(uv_idle_t* handle)
    {
        MSG msg;
        if(PeekMessage(&msg, NULL, 0, 0, PM_REMOVE))
        {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
    }
};

class instance_data
{
    uv_message_pump pump;
public:
    instance_data(Napi::Env env)
        : pump(env)
    {
    }

    ~instance_data() {

    }
};


Napi::Object Init(Napi::Env env, Napi::Object exports) {  
    //New up some instance data, it will be deleted when the module is unloaded.
    env.SetInstanceData<instance_data>(new instance_data(env));

    input_interface::init(env, exports);

    return exports;
}

NODE_API_MODULE(castmate_plugin_input_native, Init)