#include <napi.h>

#include <map>
#include <string>
#include <initguid.h>
#include <comdef.h>
#include <wrl.h>
#include <sphelper.h>



//ISpVoice can't be shared across threads, so this is a context that is created to be run on one thread.
class os_tts_interface;

class os_tts_worker : public Napi::AsyncWorker
{
    Microsoft::WRL::ComPtr<ISpObjectToken> voice_token;
    std::wstring message;
    std::string filename;
public:
    os_tts_worker(Microsoft::WRL::ComPtr<ISpObjectToken> voice_token, const std::wstring& message, const std::string& filename, const Napi::Function &callback);
protected:
    void Execute() override;
private:
    bool handle_error(HRESULT hr, const std::string& message);
};

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