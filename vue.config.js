const path = require('path');

module.exports = {
	configureWebpack: {
		devtool: 'source-map',
	},
	pluginOptions: {
		electronBuilder: {
			externals: [
				"win32-api",
				"ffi-napi",
				"ref-napi",
				"node-gyp-build",
				"@peter-murray/hue-bridge-model",
				"node-hue-api",
				"jsdom",
				"canvas",
				"chokidar",
				"@nut-tree/nut-js",
				'@twurple/api',
				'@twurple/chat',
				'@twurple/auth',
				'@twurple/pubsub',
				'ws'
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
