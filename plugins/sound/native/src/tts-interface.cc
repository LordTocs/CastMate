#include "tts-interface.hh"
#include "util.hh"
#include <iostream>
#include <sphelper.h>

using namespace Microsoft::WRL;

os_tts_interface::os_tts_interface(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<os_tts_interface>(info)
{
    HRESULT hr;
    Napi::Env env = info.Env();
    hr = ::CoCreateInstance(__uuidof(SpVoice), nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(sp_voice.ReleaseAndGetAddressOf()));

    if (error_handler(hr, "Unable to create voice interface", env))
    {
        return;
    }
}

static Napi::Value get_js_sp_token(ISpObjectToken* token, Napi::Env env)
{
    if (token == nullptr) return env.Undefined();

    HRESULT hr;

    CSpDynamicString id_str;
    hr = token->GetId(&id_str);
    std::wstring widstr(id_str.m_psz);
    std::u16string u16idstr (widstr.begin(), widstr.end());

    CSpDynamicString name_string;
    hr = SpGetDescription(token, &name_string);
    std::wstring wnamestr(name_string.m_psz);
    std::u16string u16namestr (wnamestr.begin(), wnamestr.end());
    
    Napi::Object result = Napi::Object::New(env);
    result.Set("id", Napi::String::New(env, u16idstr));
    result.Set("name", Napi::String::New(env, u16namestr));

    return result;
}

Napi::Value os_tts_interface::get_voices(const Napi::CallbackInfo& info)
{
    HRESULT hr;
    Napi::Env env = info.Env();
    ComPtr<IEnumSpObjectTokens> token_enum;

    hr = SpEnumTokens(SPCAT_VOICES, nullptr, nullptr, &token_enum);
    if (error_handler(hr, "Unable to enumerate voices", env)) {
        return env.Undefined();
    }

    ULONG count = 0;
    hr = token_enum->GetCount(&count);
    if (error_handler(hr, "Unable to get count of voices", env)) {
        return env.Undefined();
    }

    std::map<std::string, ComPtr<ISpObjectToken>> voice_token_map;

    Napi::Array result = Napi::Array::New(env);
    int added = 0;

    for (unsigned int i = 0; i < count; ++i) {
        ComPtr<ISpObjectToken> voice_token;
        token_enum->Item(i, voice_token.ReleaseAndGetAddressOf());

        LPWSTR device_id_ptr;
        voice_token->GetId(&device_id_ptr);
        std::wstring id(device_id_ptr);
        ::CoTaskMemFree(device_id_ptr);

        voice_token_map[std::string(id.begin(), id.end())] = voice_token;

        Napi::Value js_obj = get_js_sp_token(voice_token.Get(), env);
        if (!js_obj.IsUndefined()) {
            result[added++] = js_obj;
        }
    }

    voice_tokens = voice_token_map;

    return result;
}

Napi::Value os_tts_interface::speak_to_file(const Napi::CallbackInfo& info) 
{
    //TODO: Make async!
    HRESULT hr;
    Napi::Env env = info.Env();
    Napi::String message = info[0].As<Napi::String>();
    Napi::String filename = info[1].As<Napi::String>();
    Napi::String voice_id = info[2].As<Napi::String>();

    auto voice_i = voice_tokens.find(voice_id.Utf8Value());
    if (voice_i == voice_tokens.end()) return Napi::Boolean::From(env, false);

    hr = sp_voice->SetVoice(voice_i->second.Get());
    if (error_handler(hr, "Failed to set voice.", env)) {
        return Napi::Boolean::From(env, false);
    }

    CSpStreamFormat fmt;
    hr = fmt.AssignFormat(SPSF_22kHz16BitMono);
    if (error_handler(hr, "Failed to create format for tts output", env)) {
        return Napi::Boolean::From(env, false);
    }

    std::string filename_str = filename.Utf8Value();
    ComPtr<ISpStream> file_stream;
    hr = SPBindToFile(filename_str.c_str(), SPFM_CREATE_ALWAYS, file_stream.ReleaseAndGetAddressOf(),  &fmt.FormatId(), fmt.WaveFormatExPtr());
    if (error_handler(hr, "Failed to create stream for output", env)){
        return Napi::Boolean::From(env, false);
    }

    hr = sp_voice->SetOutput(file_stream.Get(), true);
    if (error_handler(hr, "Failed to set voice output", env)) {
        return Napi::Boolean::From(env, false);
    }

    std::u16string u16message = message.Utf16Value();
    std::wstring wmessage (u16message.begin(), u16message.end());
    ULONG stream_number;
    hr = sp_voice->Speak(wmessage.c_str(), SPF_DEFAULT, NULL);
    if (error_handler(hr, "Failed to speak", env)) {
        return Napi::Boolean::From(env, false);
    }

    hr = file_stream->Close();
    if (error_handler(hr, "Failed to close stream", env)) {
        return Napi::Boolean::From(env, false);
    }

    return Napi::Boolean::From(env, true);
}

Napi::Object os_tts_interface::init(Napi::Env env, Napi::Object exports)
{
    Napi::Function constructor = DefineClass(env, "OsTTSInterface", {
        InstanceMethod("getVoices", &os_tts_interface::get_voices),
        InstanceMethod("speakToFile", &os_tts_interface::speak_to_file),
    });

    exports.Set("OsTTSInterface", constructor);
    return exports;  
}