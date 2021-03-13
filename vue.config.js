module.exports = {
	pluginOptions: {
		electronBuilder: {
			externals: ["win32-api","ffi-napi", "ref-napi", "node-gyp-build", "@peter-murray/hue-bridge-model", "node-hue-api"],
			nodeIntegration: true
		}
	}
}