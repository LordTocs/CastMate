#include <napi.h>
#include <windows.h>

class input_interface : public Napi::ObjectWrap<input_interface>
{
public:
    static Napi::Object init(Napi::Env env, Napi::Object exports);

    input_interface(const Napi::CallbackInfo& info);

    Napi::Value simulate_key_down(const Napi::CallbackInfo& info);
    Napi::Value simulate_key_up(const Napi::CallbackInfo& info);

    Napi::Value simulate_mouse_down(const Napi::CallbackInfo& info);
    Napi::Value simulate_mouse_up(const Napi::CallbackInfo& info);

    Napi::Value start_events(const Napi::CallbackInfo& info);
    Napi::Value stop_events(const Napi::CallbackInfo& info);

    Napi::Value is_key_down(const Napi::CallbackInfo& info);

    void handle_key_event(uint32_t vkcode, bool pressed);

    void Finalize(Napi::Env env) override;
private:
    HWND input_window = 0;
    Napi::Function emit;
    Napi::ThreadSafeFunction tsfn;

    bool key_states[256];
};
