module.exports = {
	configureWebpack: {
		devtool: 'source-map'
	},

	pluginOptions: {
		electronBuilder: {
			externals: ["win32-api", "ffi-napi", "ref-napi", "node-gyp-build", "@peter-murray/hue-bridge-model", "node-hue-api", "jsdom", "canvas", "chokidar"],
			nodeIntegration: true,
			builderOptions: {
				productName: "CastMate",
				win: {
					target: [
						"portable"
					]
				},
				portable: {
					artifactName: "castmate.exe"
				}
			}
		}
	},

	transpileDependencies: [
		'vuetify'
	]
}
