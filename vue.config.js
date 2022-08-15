const path = require('path');

module.exports = {
	configureWebpack: {
		devtool: 'source-map',
	},
	pages: {
		index: 'src/main.js',
		updater: 'src/updater/main.js'
	},
	pluginOptions: {
		electronBuilder: {
			externalsPresets: { node: true },
			experimentalNativeDepCheck: true,
			externals: [
				"ffi-napi",
				"ref-napi",
				"ref-struct-di",
				"win32-api",
				"win32-def",
				"ref-union-di",
				"@waiting/shared-types",
				"node-addon-api",
				"get-uv-event-loop-napi-h",		
				"node-gyp-build",
				"@peter-murray/hue-bridge-model",
				"node-hue-api",
				"canvas",
				"chokidar",
				'@twurple/api',
				'@twurple/chat',
				'@twurple/auth',
				'@twurple/pubsub',
				'ws',
				'nanoid',
			],
			nodeIntegration: true,
			builderOptions: {
				nsis: {
					oneClick: false,
					allowToChangeInstallationDirectory: true,
				},
				publish: [{
					provider: 'github',
					owner: "LordTocs",
					repo: "CastMate"
				}],
				productName: "CastMate",
				extraResources: [
					{
						"from": "node_modules/regedit/vbs",
						"to": "regedit/vbs",
						"filter": [
							"**/*"
						]
					}
				],
				extraFiles: [
					{
						from: "web",
						to: "web",
					}
				]
			},
			mainProcessWatch: ['src/core/**'],
		}
	},

	transpileDependencies: [
		'vuetify'
	]
}
