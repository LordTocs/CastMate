#include <napi.h>
#include <uv.h> //ABI Stability questions go here...

#include <comdef.h>
#include <sphelper.h>
#include <string>
#include <sstream>
#include <iomanip>
#include <iostream>

#include <thread>
#include <queue>
#include <mutex>
#include <condition_variable>

// REFERENCES

// Grammar Object https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ms718871(v=vs.85)
// Grammar Structure https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee125667(v=vs.85)
// Grammar Example Code https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee450817(v=vs.85)

//Create a diction grammar as well
//Create rule with GetRule()
//Add each trigger as a phrase Word Transition to the rule
//Clear it out at the start of each time.

//Instance data is stored per thread context in js land. 
//When the module is unloaded it's destroyed via delete


bool error_handler(HRESULT result, const std::string& message, const Napi::CallbackInfo& info)
{
    if (SUCCEEDED(result))
    {
        return false;
    }

    std::stringstream ss;

    ss << "FAILURE(";
    // Hresults are searchable via hex...
    ss << "0x" << std::uppercase << std::setfill('0') << std::setw(8) << std::hex << result;
    ss << "): ";
    ss << message << " : ";

    _com_error err(result);
    ss << err.ErrorMessage();

    Napi::Error::New(info.Env(), ss.str()).ThrowAsJavaScriptException();
    return true;
}

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
public:
    Napi::FunctionReference command_grammar_constructor;
    Napi::FunctionReference speech_recognizer_constructor;
    Napi::FunctionReference speech_engine_constructor;
    Napi::FunctionReference audio_input_constructor;

    instance_data(Napi::Env env) 
        //: message_pump(env)
    {
        HRESULT hr;
    #ifdef _WIN32_WCE
        hr = ::CoInitializeEx(NULL, COINIT_MULTITHREADED);
    #else
        hr = ::CoInitialize(NULL);
    #endif
        needs_uninit = hr == S_OK;
    }

    ~instance_data()
    {
        if (needs_uninit)
        {
            ::CoUninitialize();
        }
    }
private:
    //uv_message_pump message_pump;
    bool needs_uninit;
};


class audio_input;
class speech_engine;
class command_grammar;
class speech_recognizer;

struct recognition_result
{
    std::u16string text;
    float confidence;
};

//Handles a callback from any thread (via speech_recognizer_notify_sink)
//Queues them up, and uses a ThreadSafeFunction to notify JS land.
//invoke can technically be called from any thread so we queue things up and handle them
//from a central thread to make ref counting threads possible.
class speech_recognition_callback
{
public:
    speech_recognition_callback();
    ~speech_recognition_callback();

    void set_callback(Napi::Env env, Napi::Function callback_function);
    void invoke(const std::u16string &text, float confidence);
private:

    class context
    {
    public:
        //Order here matters, make sure all our sync primitives are constructed
        speech_recognition_callback* callback;
        
        std::mutex queue_mutex;
        std::queue<recognition_result> invocations;
        std::condition_variable queue_condition;
        bool running;

        //Then our tsfn
        Napi::ThreadSafeFunction tsfn;
        
        //Then our thread last
        std::thread queue_thread;
        void queue_thread_func();

        context(speech_recognition_callback* callback, Napi::Env env, Napi::Function callbackFunction);
        void push(const std::u16string &text, float confidence);
        void destroy();

        static void finalizer(Napi::Env env, void* data, context* context);
    };
    friend class context;

    //Probably should have an access mutex, but that's a story for another time.
    context* active_context;
};

class speech_recognizer : public Napi::ObjectWrap<speech_recognizer>
{
public:
    static Napi::Object init(Napi::Env env, Napi::Object exports);
    
    speech_recognizer(const Napi::CallbackInfo& info);
    ~speech_recognizer();

    void handle_recognition();

    friend class command_grammar;
private:
    class speech_recognizer_notify_sink : public ISpNotifySink
    {
        volatile unsigned int refs;
    public:
        speech_recognizer* recognizer;

        speech_recognizer_notify_sink(speech_recognizer* recognizer)
            : recognizer(recognizer)
            , refs(0)
        {}

        HRESULT Notify() override
        {
            if (recognizer)
            {
                recognizer->handle_recognition();
            }
            return S_OK;
        }

        ULONG AddRef() override
        {
            InterlockedIncrement(&refs);
            return refs;
        }

        ULONG Release() override
        {
            ULONG result = InterlockedDecrement(&refs);
            if (0 == refs)
            {
                delete this;
            }
            return result;
        }

        HRESULT QueryInterface (REFIID riid, LPVOID * ppvObj)
        {
            // Always set out parameter to NULL, validating it first.
            if (!ppvObj)
                return E_INVALIDARG;
            *ppvObj = NULL;
            if (riid == IID_IUnknown || riid == IID_ISpNotifySink)
            {
                // Increment the reference count and return the pointer.
                *ppvObj = (LPVOID)this;
                AddRef();
                return NOERROR;
            }
            return E_NOINTERFACE;
        }
    };

    CComPtr<ISpRecognizer> recognizer;
    CComPtr<ISpRecoContext> recognition_context;
    CComPtr<ISpRecoGrammar> dictation_grammar;
    CComPtr<speech_recognizer_notify_sink> notifier;
    speech_recognition_callback callback;

    CComPtr<ISpAudio> audio;

    static void RecognitionCallbackFinalizer(Napi::Env env, speech_recognizer* finalizeData, void* context);
    Napi::Value set_recognition_callback(const Napi::CallbackInfo& info);
    Napi::Value enable_microphone(const Napi::CallbackInfo& info);
    Napi::Value disable_microphone(const Napi::CallbackInfo& info);
};

class speech_engine : public Napi::ObjectWrap<speech_engine> 
{
public:
    static Napi::Object init(Napi::Env env, Napi::Object exports);
    speech_engine(const Napi::CallbackInfo& info);
    void initialize(const CComPtr<ISpObjectToken>& in_engine_token);

    friend class speech_recognizer;
private:
    CComPtr<ISpObjectToken> engine_token;

    static Napi::Value get_default_engine(const Napi::CallbackInfo& info);
    static Napi::Value get_all(const Napi::CallbackInfo& info);
    Napi::Value to_string(const Napi::CallbackInfo& info);
};

class audio_input : public Napi::ObjectWrap<audio_input>
{
public:
    static Napi::Object init(Napi::Env env, Napi::Object exports);
    
    audio_input(const Napi::CallbackInfo& info);
    void initialize(const CComPtr<ISpObjectToken>& in_engine_token);

    friend class speech_recognizer;
private:
    CComPtr<ISpObjectToken> input_token;

    static Napi::Value get_default_input(const Napi::CallbackInfo& info);
    static Napi::Value get_all(const Napi::CallbackInfo& info);
    Napi::Value to_string(const Napi::CallbackInfo& info);
};

class command_grammar : public Napi::ObjectWrap<command_grammar>
{
public:
    static Napi::Object init(Napi::Env env, Napi::Object exports);
    command_grammar(const Napi::CallbackInfo& info);

private:
    unsigned long long id;
    CComPtr<ISpRecoGrammar> grammar;
    Napi::Value set_commands(const Napi::CallbackInfo& info);
    Napi::Value deactivate(const Napi::CallbackInfo& info);
    Napi::Value activate(const Napi::CallbackInfo& info);
};

//////////////////////////////////////////////////////////////////
//////////////////////SPEECH ENGINE///////////////////////////////
//////////////////////////////////////////////////////////////////


Napi::Object speech_engine::init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func = DefineClass(env, "SpeechEngine", {
        InstanceMethod("toString", &speech_engine::to_string),
        StaticMethod("getDefaultEngine", &speech_engine::get_default_engine),
        StaticMethod("getAll", &speech_engine::get_all)
    });
    exports.Set("SpeechEngine", func);

    //Store a persistant reference to the constructor func in the instance_data
    env.GetInstanceData<instance_data>()->speech_engine_constructor = Napi::Persistent(func);
    
    return exports;
}

speech_engine::speech_engine(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<speech_engine>(info)
{

}

void speech_engine::initialize(const CComPtr<ISpObjectToken>& in_engine_token)
{
    engine_token = in_engine_token;
}

Napi::Value speech_engine::get_default_engine(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    CComPtr<ISpObjectToken> default_engine;
    HRESULT hr = SpGetDefaultTokenFromCategoryId(SPCAT_RECOGNIZERS, &default_engine);
    if (error_handler(hr, "Unable to get default engine", info))
    {
        return env.Undefined();
    }

    Napi::Object result = env.GetInstanceData<instance_data>()->speech_engine_constructor.New({});

    speech_engine* engine_obj = speech_engine::Unwrap(result);
    engine_obj->initialize(default_engine);

    return result;
}

Napi::Value speech_engine::get_all(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    CComPtr<IEnumSpObjectTokens> cpEnum;

    HRESULT hr;
    hr = SpEnumTokens(SPCAT_RECOGNIZERS, NULL, NULL, &cpEnum);
    if (error_handler(hr, "Unable to get speech engines.", info))
    {
        return env.Undefined();
    }

    Napi::Array result = Napi::Array::New(env);
    ISpObjectToken *engine_token;
    int index = 0;
    while (cpEnum->Next(1, &engine_token, NULL) == S_OK)
    {
        Napi::Object engine = env.GetInstanceData<instance_data>()->speech_engine_constructor.New({});
        speech_engine* engine_obj = speech_engine::Unwrap(engine);
        
        engine_obj->initialize(engine_token);
        result[index] = engine;

        engine_token->Release(); //TODO: Can we do this with CComPtr<>
    }

    return result;
}

Napi::Value speech_engine::to_string(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    CSpDynamicString name_string;
    if (SUCCEEDED(SpGetDescription(engine_token, &name_string)))
    {
        //WTF
        std::wstring wstr(name_string.m_psz);
        std::u16string u16str (wstr.begin(), wstr.end());
        return Napi::String::New(env, u16str);
    }

    return Napi::String::New(env, "[Failed to get Engine Name]");
}

//////////////////////////////////////////////////////////////////
//////////////////////COMMAND GRAMMAR/////////////////////////////
//////////////////////////////////////////////////////////////////


Napi::Object audio_input::init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func = DefineClass(env, "AudioInput", {
        InstanceMethod("toString", &audio_input::to_string),
        StaticMethod("getDefaultInput", &audio_input::get_default_input),
        StaticMethod("getAll", &audio_input::get_all)
    });
    exports.Set("AudioInput", func);

    //Store a persistant reference to the constructor func in the instance_data
    env.GetInstanceData<instance_data>()->audio_input_constructor = Napi::Persistent(func);
    
    return exports;
}

audio_input::audio_input(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<audio_input>(info)
{

}

void audio_input::initialize(const CComPtr<ISpObjectToken>& in_input_token)
{
    input_token = in_input_token;
}

Napi::Value audio_input::get_default_input(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    CComPtr<ISpObjectToken> default_input;
    HRESULT hr = SpGetDefaultTokenFromCategoryId(SPCAT_AUDIOIN, &default_input);
    if (error_handler(hr, "Unable to get audio input", info))
    {
        return env.Undefined();
    }

    Napi::Object result = env.GetInstanceData<instance_data>()->audio_input_constructor.New({});

    audio_input* obj = audio_input::Unwrap(result);
    obj->initialize(default_input);

    return result;
}

Napi::Value audio_input::get_all(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    CComPtr<IEnumSpObjectTokens> cpEnum;

    HRESULT hr;
    hr = SpEnumTokens(SPCAT_AUDIOIN, NULL, NULL, &cpEnum);
    if (error_handler(hr, "Unable to get audio inputs", info))
    {
        return env.Undefined();
    }

    Napi::Array result = Napi::Array::New(env);
    ISpObjectToken *input_token;
    int index = 0;
    while (cpEnum->Next(1, &input_token, NULL) == S_OK)
    {
        Napi::Object input = env.GetInstanceData<instance_data>()->audio_input_constructor.New({});
        audio_input* obj = audio_input::Unwrap(input);
        
        obj->initialize(input_token);
        result[index] = input;

        input_token->Release(); //TODO: Can we do this with CComPtr<>
    }

    return result;
}

Napi::Value audio_input::to_string(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    CSpDynamicString name_string;
    if (SUCCEEDED(SpGetDescription(input_token, &name_string)))
    {
        //WTF
        std::wstring wstr(name_string.m_psz);
        std::u16string u16str (wstr.begin(), wstr.end());
        return Napi::String::New(env, u16str);
    }

    return Napi::String::New(env, "[Failed to get Input Name]");
}


//////////////////////////////////////////////////////////////////
//////////////////////COMMAND GRAMMAR/////////////////////////////
//////////////////////////////////////////////////////////////////

Napi::Object command_grammar::init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func = DefineClass(env, "CommandGrammer", {
        InstanceMethod("setCommands", &command_grammar::set_commands),
        InstanceMethod("deactivate", &command_grammar::deactivate),
        InstanceMethod("activate", &command_grammar::activate),
    });
    exports.Set("CommandGrammar", func);

    //Store a persistant reference to the constructor func in the instance_data
    env.GetInstanceData<instance_data>()->speech_recognizer_constructor = Napi::Persistent(func);
    
    return exports;
}

 command_grammar::command_grammar(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<command_grammar>(info)
{
    HRESULT hr;
    Napi::Env env = info.Env();

    if (info.Length() < 1) 
    {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return;
    }

    speech_recognizer* recognizer = speech_recognizer::Unwrap(info[0].As<Napi::Object>());

    if (!recognizer)
    {
        Napi::TypeError::New(env, "Argument 0 must be a SpeechRecognizer").ThrowAsJavaScriptException();
        return;
    }

    static unsigned long long id_source = 101;
    id = id_source++;
    hr = recognizer->recognition_context->CreateGrammar(id, &grammar);
    if (error_handler(hr, "Failed to create Command Grammar", info))
    {
        return;
    }

    SPSTATEHANDLE command_rule_handle;
    hr = grammar->GetRule(L"Commands", 0, SPRAF_TopLevel | SPRAF_Active | SPRAF_Dynamic, true, &command_rule_handle);
    if (error_handler(hr, "Failed to get/create Commands rule.", info))
    {
        return;
    }

    hr = grammar->Commit(0);
    if (error_handler(hr, "Failed to Commit Grammar Commands", info))
    {
        return;
    }


}

Napi::Value command_grammar::deactivate(const Napi::CallbackInfo& info)
{
    HRESULT hr;
    Napi::Env env = info.Env();

    hr = grammar->SetRuleState(L"Commands", nullptr, SPRS_INACTIVE);
    if (error_handler(hr, "Failed to set Commands rule as active", info))
    {
        return env.Undefined();
    }

    return env.Undefined();
}

Napi::Value command_grammar::activate(const Napi::CallbackInfo& info)
{
    HRESULT hr;
    Napi::Env env = info.Env();

    hr = grammar->SetRuleState(L"Commands", nullptr, SPRS_ACTIVE);
    if (error_handler(hr, "Failed to set Commands rule as active", info))
    {
        return env.Undefined();
    }

    return env.Undefined();
}

Napi::Value command_grammar::set_commands(const Napi::CallbackInfo& info)
{
    HRESULT hr;
    Napi::Env env = info.Env();

    if (info.Length() < 1) 
    {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    SPSTATEHANDLE command_rule_handle;

    Napi::Array command_list = info[0].As<Napi::Array>();

    hr = grammar->GetRule(L"Commands", 0, SPRAF_TopLevel | SPRAF_Dynamic, true, &command_rule_handle);
    if (error_handler(hr, "Failed to get/create Commands rule.", info))
    {
        return env.Undefined();
    }

    /*hr = grammar->SetRuleState(L"Commands", nullptr, SPRS_INACTIVE);
    if (error_handler(hr, "Failed to set Commands rule as active", info))
    {
        return env.Undefined();
    }*/

    hr = grammar->ClearRule(command_rule_handle);
    if (error_handler(hr, "Failed to clear Commands rule", info))
    {
        return env.Undefined();
    }

    for (int i = 0; i < command_list.Length(); ++i)
    {
        Napi::Value strvalue = command_list[i];
        Napi::String string = strvalue.As<Napi::String>();

        std::u16string u16str = string.Utf16Value();
        std::wstring wstr (u16str.begin(), u16str.end());

        //std::cout << "Adding Command " << string.Utf8Value() << std::endl;

        hr = grammar->AddWordTransition(command_rule_handle, nullptr, wstr.c_str(), L" ", SPWT_LEXICAL, 1, NULL);
        if (!SUCCEEDED(hr))
        {
            //TODO: Error
            std::cout << "Failed Adding Command " << string.Utf8Value() << std::endl;
        }
    }

    hr = grammar->Commit(0);
    if (error_handler(hr, "Failed to Commit Grammar Commands", info))
    {
        return env.Undefined();
    }

    /*hr = grammar->SetRuleState(L"Commands", nullptr, SPRS_ACTIVE);
    if (error_handler(hr, "Set rules as active", info))
    {
        return env.Undefined();
    }*/

    return env.Undefined();
}

//////////////////////////////////////////////////////////////////
//////////////////////SPEECH RECOGNIZER///////////////////////////
//////////////////////////////////////////////////////////////////

//Notify Callback
void __stdcall speech_engine_callback(WPARAM wParam, LPARAM lParam);

Napi::Object speech_recognizer::init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func = DefineClass(env, "SpeechRecognizer", {
        InstanceMethod("setRecognitionCallback", &speech_recognizer::set_recognition_callback),
        InstanceMethod("enableMicrophone", &speech_recognizer::enable_microphone),
        InstanceMethod("disableMicrophone", &speech_recognizer::disable_microphone)
    });
    exports.Set("SpeechRecognizer", func);


    //Store a persistant reference to the constructor func in the instance_data
    env.GetInstanceData<instance_data>()->speech_recognizer_constructor = Napi::Persistent(func);
    
    return exports;
}

speech_recognizer::speech_recognizer(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<speech_recognizer>(info)
    , notifier(new speech_recognizer_notify_sink(this))
{
    Napi::Env env = info.Env();

    if (info.Length() < 2) 
    {
        Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return;
    }

    speech_engine* engine = speech_engine::Unwrap(info[0].As<Napi::Object>());
    if (!engine)
    {
        Napi::Error::New(env, "Argument 0 is supposed to be a SpeechEngine").ThrowAsJavaScriptException();
        return;
    }

    audio_input* input = audio_input::Unwrap(info[1].As<Napi::Object>());
    if (!input)
    {
        Napi::Error::New(env, "Argument 0 is supposed to be an AudioInput").ThrowAsJavaScriptException();
        return;
    }


    HRESULT hr;
    //Create a recognizer
    hr = recognizer.CoCreateInstance(CLSID_SpInprocRecognizer);
    if (error_handler(hr, "Unable to create speech engine", info))
    {
        return;
    }

    //Set the speech engine
    hr = recognizer->SetRecognizer(engine->engine_token);
    if (error_handler(hr, "Unable to set engine", info))
    {
        return;
    }

    hr = SpCreateObjectFromToken(input->input_token, &audio);
    if (error_handler(hr, "Unable to create audio stream", info))
    {
        return;
    }


    hr = recognizer->SetInput(audio, true);
    if (error_handler(hr, "Unable to set input", info))
    {
        return;
    }
    

    //Create a context
    hr = recognizer->CreateRecoContext(&recognition_context);
    if (error_handler(hr, "Unable to create speech recognition context", info))
    {
        return;
    }

    {
        CComPtr<ISpRecoContext2> recognition_context2;
        HRESULT hr2;

        hr2 = recognition_context.QueryInterface(&recognition_context2);

        if (SUCCEEDED(hr2))
        {
            hr = recognition_context2->SetGrammarOptions(SPGO_ALL);
        }
    }

    //Set the notify sink
    hr = recognition_context->SetNotifySink(notifier);
    if (error_handler(hr, "Unable to set notify sink", info))
    {
        return;
    }
    
    const ULONGLONG ullInterest = SPFEI(SPEI_SOUND_START) | SPFEI(SPEI_SOUND_END)
                                //SPFEI(SPEI_PHRASE_START) |
                                | SPFEI(SPEI_RECOGNITION)
                                //SPFEI(SPEI_FALSE_RECOGNITION) | SPFEI(SPEI_HYPOTHESIS) |
                                | SPFEI(SPEI_INTERFERENCE)
                                //SPFEI(SPEI_RECO_OTHER_CONTEXT) |
                                //SPFEI(SPEI_REQUEST_UI) |
                                | SPFEI(SPEI_RECO_STATE_CHANGE)// |
                                //SPFEI(SPEI_PROPERTY_NUM_CHANGE) | SPFEI(SPEI_PROPERTY_STRING_CHANGE) |
                                | SPFEI(SPEI_END_SR_STREAM) | SPFEI(SPEI_START_SR_STREAM)
                                // | SPFEI(SPEI_ADAPTATION);
                                ;

    hr = recognition_context->SetInterest(ullInterest, ullInterest);
    if (error_handler(hr, "Unable to set speech event interests.", info))
    {
        return;
    }

    hr = recognition_context->SetMaxAlternates( 3 );
    if (error_handler(hr, "Unable to speech max alternates", info))
    {
        return;
    }


 
    //Load diction
    /*
    hr = recognition_context->CreateGrammar(0, &dictation_grammar);
    if (error_handler(hr, "Unable to create dictation grammar", info))
    {
        return;
    }

    hr = dictation_grammar->LoadDictation(nullptr, SPLO_STATIC);
    if (error_handler(hr, "Unable to load dictation grammar", info))
    {
        return;
    }

    hr = dictation_grammar->SetDictationState(SPRS_ACTIVE);
    if (error_handler(hr, "Unable to load dictation grammar", info))
    {
        return;
    }
    */
    
}

speech_recognizer::~speech_recognizer() 
{
    //Null out the recognizer because the sink might outlive it.
    notifier->recognizer = nullptr;
}

void speech_recognizer::handle_recognition()
{
    CSpEvent event;
    while (event.GetFrom(recognition_context) == S_OK)
    {
        if (event.eEventId == SPEI_SOUND_START)
        {
            //std::cout << "Sound Start" << std::endl;
        }
        else if (event.eEventId == SPEI_RECOGNITION)
        {
            CSpDynamicString text;
            float confidence = 0;

            {
                SPPHRASE *phrase;

                event.RecoResult()->GetPhrase(&phrase);

                if (phrase) 
                {
                    confidence = phrase->Rule.SREngineConfidence;

                    CoTaskMemFree(phrase);
                }
            }

            

            if (SUCCEEDED(event.RecoResult()->GetText(SP_GETWHOLEPHRASE, SP_GETWHOLEPHRASE, true, &text, nullptr)))
            {
                //Do the string conversion dance
                std::wstring wstr(text.m_psz);

                //New up the recognition result here, it will be deleted by the processing thread.
                callback.invoke(std::u16string(wstr.begin(), wstr.end()), confidence);
            }
        }
        else if (event.eEventId == SPEI_SOUND_END)
        {
            //std::cout << "Sound End" << std::endl;
        }
        else if (event.eEventId == SPEI_RECO_STATE_CHANGE)
        {
            //std::cout << "Reco State Changed" << std::endl;
        }
        else if (event.eEventId == SPEI_INTERFERENCE)
        {
            //std::cout << "Interference" << std::endl;
        }
        else
        {
            //std::cout << "Other: " << event.eEventId << std::endl;
        }
    }
}

speech_recognition_callback::speech_recognition_callback()
    : active_context(nullptr)
{}

speech_recognition_callback::~speech_recognition_callback()
{
    if (active_context != nullptr)
    {
        active_context->destroy();
    }
}

void speech_recognition_callback::set_callback(Napi::Env env, Napi::Function callback_function)
{
    if (active_context != nullptr) 
    {
        active_context->destroy();
    }
    active_context = new context(this, env, callback_function);
}

void speech_recognition_callback::invoke(const std::u16string &text, float confidence)
{
    if (active_context != nullptr)
    {
        active_context->push(text, confidence);
    }
}

speech_recognition_callback::context::context(speech_recognition_callback* callback, Napi::Env env, Napi::Function callback_function)
    : callback(callback)
    , running(true)
    , tsfn(Napi::ThreadSafeFunction::New(
        env,                           // Environment
        callback_function,  // JS function from caller
        "SpeechRecognizerThreadSafeCallback",      // Resource name
        0,                             // Max queue size (0 = unlimited).
        1,                             // Initial thread count
        this,                            // Context,
        finalizer, // Finalizer
        (void*)nullptr                           // Finalizer Data
    ))
    , queue_thread(&speech_recognition_callback::context::queue_thread_func, this)
{}

void speech_recognition_callback::context::push(const std::u16string &text, float confidence)
{
    std::lock_guard<std::mutex> lk(queue_mutex);
    invocations.push({ text, confidence});
    queue_condition.notify_one();
}

void speech_recognition_callback::context::queue_thread_func()
{
    auto js_thread_callback = [](Napi::Env env, Napi::Function js_callback, recognition_result* data)
    {
        //env might be null if the tsfn is aborted
        if (env != nullptr && js_callback != nullptr) {
            js_callback.Call({Napi::String::New(env, data->text), Napi::Number::New(env, data->confidence)});
        }
        delete data;
    };

    while (running)
    {
        std::unique_lock<std::mutex> lk(queue_mutex);
        queue_condition.wait(lk);

        while (invocations.size() > 0)
        {
            recognition_result* result = new recognition_result(invocations.front());
            invocations.pop();

            napi_status status = tsfn.NonBlockingCall(result, js_thread_callback);
            if (status != napi_ok) {
                std::cerr << "Failed to call recognition callback" << std::endl;
                delete result;
            }
        }

        lk.unlock();
    }

    napi_status status = tsfn.Release();
    if (status != napi_ok)
    {
        std::cerr << "Failed to relase tsfn" << std::endl;
    }
}

void speech_recognition_callback::context::finalizer(Napi::Env env, void* data, speech_recognition_callback::context* context)
{
    std::cout << "Finalizer Called" << std::endl;
    context->destroy();
}

void speech_recognition_callback::context::destroy()
{
    std::cout << "Destroying Callback" << std::endl;
    running = false;
    queue_condition.notify_one();
    queue_thread.join();

    if (callback->active_context == this) { //TODO: Probably should be CAS
        callback->active_context = nullptr;
    }
    delete this;
    std::cout << "Callback Obliterated" << std::endl;
}

Napi::Value speech_recognizer::set_recognition_callback(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) 
    {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    callback.set_callback(env, info[0].As<Napi::Function>());

    return env.Undefined();
}

Napi::Value speech_recognizer::enable_microphone(const Napi::CallbackInfo& info)
{
    HRESULT hr = recognizer->SetRecoState( SPRST_ACTIVE );
    error_handler(hr, "Unable to start microphone", info);
    return info.Env().Undefined();
}

Napi::Value speech_recognizer::disable_microphone(const Napi::CallbackInfo& info)
{
    HRESULT hr = recognizer->SetRecoState( SPRST_INACTIVE );
    error_handler(hr, "Unable to stop microphone", info);
    return info.Env().Undefined();
}

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