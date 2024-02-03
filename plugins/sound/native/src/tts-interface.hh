#include <napi.h>

#include <map>
#include <string>
#include <initguid.h>
#include <comdef.h>
#include <wrl.h>
#include <sphelper.h>



class os_tts_interface : public Napi::ObjectWrap<os_tts_interface> 
{
public:
    static Napi::Object init(Napi::Env env, Napi::Object exports);

    os_tts_interface(const Napi::CallbackInfo& info);

    Napi::Value get_voices(const Napi::CallbackInfo& info);
    Napi::Value speak_to_file(const Napi::CallbackInfo& info);
private:
    Microsoft::WRL::ComPtr<ISpVoice> sp_voice;
    std::map<std::string, Microsoft::WRL::ComPtr<ISpObjectToken>> voice_tokens;
};