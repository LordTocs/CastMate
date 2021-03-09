module.exports = {
	pluginOptions: {
		electronBuilder: {
			externals: ["win32-api","ffi-napi", "ref-napi", "node-gyp-build", "@peter-murray/hue-bridge-model", "node-hue-api"],
			nodeIntegration: true
			/*chainWebpackMainProcess: config =>
			{
				config.module
					.rule('babel')
					.test(/\.js$/)
					//.exclude.add(/node_modules/)
					//.end()
					.use('babel')
					.loader('babel-loader')
					.options({
						presets: [['@babel/preset-env', { modules: false }]],
						plugins: ['@babel/plugin-proposal-class-properties']
					})
			},
			disableMainProcessTypescript: false, // Manually disable typescript plugin for main process. Enable if you want to use regular js for the main process (src/background.js by default).
			mainProcessTypeChecking: false // Manually enable type checking during webpck bundling for background file.*/
			//bundleMainProcess: false,
			//customFileProtocol: './'
		}
	}
}