{
    "targets": [
        {
            "target_name": "castmate-plugin-input-native",
            "cflags!": [ "-fno-exceptions" ],
            "cflags_cc!": [ "-fno-exceptions" ],
            "sources": [ "src/native-index.cc", "src/input-interface.cc" ],
            "include_dirs": [
                "<!@(node -p \"require('node-addon-api').include\")"
            ],
            "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS=1" ],
        }
    ]
}