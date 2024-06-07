#include <napi.h>

#include <string>
#include <sstream>
#include <iomanip>
#include <iostream>

#include <comdef.h>

bool error_handler(HRESULT result, const std::string& message, const Napi::Env& env)
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

    Napi::Error::New(env, ss.str()).ThrowAsJavaScriptException();
    return true;
}

bool error_handler_offthread(HRESULT result, const std::string& message)
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
    return true;
}