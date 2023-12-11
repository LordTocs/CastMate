#include <napi.h>
#include <comdef.h>


bool error_handler(HRESULT result, const std::string& message, const Napi::Env& env);
bool error_handler_offthread(HRESULT result, const std::string& message);