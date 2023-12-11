#include <napi.h>
#include <uv.h> //ABI Stability questions go here...


Napi::Object Init(Napi::Env env, Napi::Object exports) {  
    //New up some instance data, it will be deleted when the module is unloaded.
    env.SetInstanceData<instance_data>(new instance_data(env));

    audio_input::init(env, exports);
    speech_engine::init(env, exports);
    command_grammar::init(env, exports);
    speech_recognizer::init(env, exports);

    return exports;
}

NODE_API_MODULE(ms_speech_native, Init)