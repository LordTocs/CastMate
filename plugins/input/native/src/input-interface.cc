#include "input-interface.hh"

#include <windows.h>

#include <string>
#include <sstream>
#include <iomanip>
#include <iostream>

Napi::Object input_interface::init(Napi::Env env, Napi::Object exports)
{
    Napi::Function constructor = DefineClass(env, "NativeInputInterface", {
        InstanceMethod("simulateKeyDown", &input_interface::simulate_key_down),
        InstanceMethod("simulateKeyUp", &input_interface::simulate_key_up),
        InstanceMethod("simulateMouseDown", &input_interface::simulate_mouse_down),
        InstanceMethod("simulateMouseUp", &input_interface::simulate_mouse_down),
        InstanceMethod("startEvents", &input_interface::start_events),
        InstanceMethod("stopEvents", &input_interface::stop_events),
        InstanceMethod("isKeyDown", &input_interface::is_key_down),
    });

    exports.Set("NativeInputInterface", constructor);
    return exports;  
}

void input_interface::Finalize(Napi::Env env)
{
    tsfn.Release();
}

static void finalizer(Napi::Env env, void* data, input_interface* context)
{

}

input_interface::input_interface(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<input_interface>(info)
    , emit(info[0].As<Napi::Function>())
    , tsfn(Napi::ThreadSafeFunction::New(info.Env(),
        emit,
        "InputInterfaceEmitTSFN",
        0,
        1,
        this,
        finalizer,
        (void*)nullptr
    ))
{
    memset(key_states, 0, sizeof(key_states));
}

Napi::Value input_interface::simulate_key_down(const Napi::CallbackInfo& info)
{
    INPUT input = {0};
    input.type = INPUT_KEYBOARD;
    input.ki.wVk = info[0].As<Napi::Number>().Int32Value();
    
    uint32_t result = SendInput(1, static_cast<INPUT*>(&input), sizeof(input));
    if (result != 1) {
        //ERROR
    }

    return info.Env().Undefined();
}

Napi::Value input_interface::simulate_key_up(const Napi::CallbackInfo& info)
{
 INPUT input = {0};
    input.type = INPUT_KEYBOARD;
    input.ki.wVk = info[0].As<Napi::Number>().Int32Value();
    input.ki.dwFlags = KEYEVENTF_KEYUP;
    
    uint32_t result = SendInput(1, static_cast<INPUT*>(&input), sizeof(input));
    if (result != 1) {
        //ERROR
    }

    return info.Env().Undefined();
}

/////////////////////////////MOUSE/////////////////////////////////////////

Napi::Value input_interface::simulate_mouse_down(const Napi::CallbackInfo& info)
{
    Napi::String button = info[0].As<Napi::String>();
    std::string button_str = button.Utf8Value();
    
    INPUT input = {0};
    input.type = INPUT_MOUSE;

    if (button_str == "left") {
        input.mi.dwFlags = MOUSEEVENTF_LEFTDOWN;
    } else if (button_str == "right") {
        input.mi.dwFlags = MOUSEEVENTF_RIGHTDOWN;
    } else if (button_str == "middle") {
        input.mi.dwFlags = MOUSEEVENTF_MIDDLEDOWN;
    } else if (button_str == "mouse4") {
        input.mi.dwFlags = MOUSEEVENTF_XDOWN;
        input.mi.mouseData = XBUTTON1;
    } else if (button_str == "mouse5") {
        input.mi.dwFlags = MOUSEEVENTF_XDOWN;
        input.mi.mouseData = XBUTTON2;
    }
    
    uint32_t result = SendInput(1, static_cast<INPUT*>(&input), sizeof(input));
    if (result != 1) {
        //ERROR
    }

    return info.Env().Undefined();
}

Napi::Value input_interface::simulate_mouse_up(const Napi::CallbackInfo& info)
{
    Napi::String button = info[0].As<Napi::String>();
    std::string button_str = button.Utf8Value();
    
    INPUT input = {0};
    input.type = INPUT_MOUSE;

    if (button_str == "left") {
        input.mi.dwFlags = MOUSEEVENTF_LEFTUP;
    } else if (button_str == "right") {
        input.mi.dwFlags = MOUSEEVENTF_RIGHTUP;
    } else if (button_str == "middle") {
        input.mi.dwFlags = MOUSEEVENTF_MIDDLEUP;
    } else if (button_str == "mouse4") {
        input.mi.dwFlags = MOUSEEVENTF_XUP;
        input.mi.mouseData = XBUTTON1;
    } else if (button_str == "mouse5") {
        input.mi.dwFlags = MOUSEEVENTF_XUP;
        input.mi.mouseData = XBUTTON2;
    }
    
    uint32_t result = SendInput(1, static_cast<INPUT*>(&input), sizeof(input));
    if (result != 1) {
        //ERROR
    }

    return info.Env().Undefined();
}

///EVENTS

void input_interface::handle_key_event(uint32_t vkcode, bool pressed)
{
    //std::cout << "Key event " << vkcode << " " << pressed << std::endl;
    const bool was_pressed = key_states[vkcode];
    if (pressed) {
        key_states[vkcode] = true;
        if (!was_pressed) {

            auto js_thread_callback = [=](Napi::Env env, Napi::Function js_callback)
            {
                //env might be null if the tsfn is aborted
                if (env == nullptr || js_callback == nullptr) return;

                //std::cout << "Emitting key-pressed " << vkcode << std::endl;

                js_callback.Call({Napi::String::New(env, "key-pressed"), Napi::Number::New(env, vkcode) });

            };

             //std::cout << "Queuing key-pressed " << vkcode << std::endl;
            tsfn.NonBlockingCall(js_thread_callback);
        }
    }
    else {
        key_states[vkcode] = false;
        if (was_pressed) {
            auto js_thread_callback = [=](Napi::Env env, Napi::Function js_callback)
            {
                //env might be null if the tsfn is aborted
                if (env == nullptr || js_callback == nullptr) return;

                //std::cout << "Emitting key-released " << vkcode << std::endl;

                js_callback.Call({Napi::String::New(env, "key-released"), Napi::Number::New(env, vkcode) });

            };

            //std::cout << "Queuing key-released " << vkcode << std::endl;
            tsfn.NonBlockingCall(js_thread_callback);
        }
    }
}

static LRESULT CALLBACK event_proc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
    input_interface* input = reinterpret_cast<input_interface*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
    if (uMsg == WM_INPUT) {
        RAWINPUT input_buffer;
		unsigned int buffsize = sizeof(RAWINPUT);
		GetRawInputData(reinterpret_cast<HRAWINPUT> (lParam), RID_INPUT, &input_buffer, &buffsize,sizeof(RAWINPUTHEADER));

        if (input_buffer.header.dwType == RIM_TYPEKEYBOARD)
        {
            //Keyboard input!
            //std::cout << "Key: " << std::hex << input_buffer.data.keyboard.VKey << ": " << input_buffer.data.keyboard.Flags << std::endl;
            input->handle_key_event(input_buffer.data.keyboard.VKey, !(input_buffer.data.keyboard.Flags & RI_KEY_BREAK));
        }
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

Napi::Value input_interface::start_events(const Napi::CallbackInfo& info)
{
	HINSTANCE hModuleInstance = GetModuleHandle (NULL);
	
    WNDCLASSEX window_class = {};
    window_class.cbSize = sizeof(WNDCLASSEX);
    window_class.lpfnWndProc = event_proc;
    window_class.hInstance = hModuleInstance;
    window_class.lpszClassName = "InputEventWindow";

	if (!RegisterClassEx (&window_class))
	{
        std::cout << "Failed to create window class" << std::endl;
		return info.Env().Undefined();
	}

    std::cout << "Starting Input Events" << std::endl;
    input_window = CreateWindow("InputEventWindow", NULL, 0, 0, 0, 0, 0, HWND_MESSAGE, 0, 0, 0);

    if (!input_window) {
         std::cout << "Failed to create window" << std::endl;
		return info.Env().Undefined();
    }

    SetWindowLongPtr(input_window, GWLP_USERDATA, (LONG_PTR)this);

    RAWINPUTDEVICE raw_devices[1];

    //https://learn.microsoft.com/en-us/windows-hardware/drivers/hid/hid-architecture#hid-clients-supported-in-windows
    //Keyboard
    raw_devices[0].usUsagePage = 0x01; //Page
    raw_devices[0].usUsage = 0x06; //Keyboard
    raw_devices[0].dwFlags = RIDEV_INPUTSINK | RIDEV_DEVNOTIFY;
    raw_devices[0].hwndTarget = input_window;

    if (!RegisterRawInputDevices(raw_devices, 1, sizeof(RAWINPUTDEVICE))) {
        std::cout << "Failed to register raw input devices" << std::endl;
    }

    return info.Env().Undefined();
}

Napi::Value input_interface::stop_events(const Napi::CallbackInfo& info)
{
    CloseWindow(input_window);
    input_window = NULL;

    return info.Env().Undefined();
}


Napi::Value input_interface::is_key_down(const Napi::CallbackInfo& info)
{
    uint32_t vkcode = info[0].As<Napi::Number>().Uint32Value();

    if (vkcode > 255) return Napi::Boolean::New(info.Env(), false);

    return Napi::Boolean::New(info.Env(), key_states[vkcode]);
}

