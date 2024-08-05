#include <uv.h> //ABI Stability questions go here...

#include <string>
#include <sstream>
#include <iomanip>
#include <iostream>

#include "input-interface.hh"


class instance_data
{
public:
    instance_data(Napi::Env env)
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