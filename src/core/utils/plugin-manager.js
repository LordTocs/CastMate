const { manualDependency } = require('./conditionals');
const { Plugin } = require('./plugin');
const { reactiveCopy, Watcher, deleteReactiveProperty } = require('./reactive');
const { ipcMain } = require("electron");
const _ = require('lodash');

class PluginManager {
	async load(ipcSender) {
		let pluginFiles = [
			//"inputs",
			"hue",
			"notifications",
			"obs",
			"sounds",
			"minecraft",
			"csgo",
			"tts",
			"kofi",
			"twitch",
			"variables",
			"websocket",
			"aoe3",
		]

		//Todo: This relative require is weird.
		this.plugins = pluginFiles.map((file) => new Plugin(require(`../plugins/${file}`)));

		this.combinedState = {};

		for (let plugin of this.plugins) {
			reactiveCopy(this.combinedState, plugin.pluginObj.state);
		}

		this.stateLookup = {};

		for (let plugin of this.plugins) {
			this.stateLookup[plugin.name] = {};
			reactiveCopy(this.stateLookup[plugin.name], plugin.pluginObj.state)
		}

		this.combinedTemplateFunctions = {}
		for (let plugin of this.plugins) {
			Object.assign(this.combinedTemplateFunctions, plugin.templateFunctions);
		}

		this.ipcSender = ipcSender;
	}

	createStateWatcher(pluginName, stateKey, reactiveObj) {
		const watcher = new Watcher(() => {
			this.webServices.websocketServer.broadcast(JSON.stringify({
				state: {
					[pluginName]: {
						[stateKey]: reactiveObj[stateKey]
					}
				}
			}))

			if (this.ipcSender) {
				this.ipcSender.send('state-update', {
					[pluginName]: {
						[stateKey]: reactiveObj[stateKey]
					}
				});
			}

		}, { fireImmediately: false })

		manualDependency(reactiveObj, watcher, stateKey);
	}

	setupReactivity() {
		for (let pluginName in this.stateLookup) {
			for (let stateKey in this.stateLookup[pluginName]) {
				this.createStateWatcher(pluginName, stateKey, this.stateLookup[pluginName])
			}
		}
	}

	updateReactivity(pluginObj) {
		console.log("updateReactivity " + pluginObj.name);
		if (!this.stateLookup[pluginObj.name])
		{
			this.stateLookup[pluginObj.name] = {};
		}
		reactiveCopy(this.stateLookup[pluginObj.name], pluginObj.state, (newKey) => {
			this.createStateWatcher(pluginObj.name, newKey, this.stateLookup[pluginObj.name])

			if (this.ipcSender) {
				this.ipcSender.send('state-update', {
					[pluginObj.name]: {
						[newKey]: this.stateLookup[pluginObj.name][newKey]
					}
				});
			}
		});
	}

	removeReactiveValue(pluginName, stateKey) {
		this.ipcSender.send('state-removal', { [pluginName]: stateKey });
	}

	async init(settings, secrets, actions, profiles, webServices) {
		for (let plugin of this.plugins) {
			try {
				await plugin.init(settings, secrets, actions, profiles, webServices, this);
			}
			catch (err) {
				console.error(err);
			}
		}

		ipcMain.handle("getPlugins", async () => {
			let pluginInfo = this.plugins.map((plugin) => plugin.getUIDescription());
			return pluginInfo;
		})

		ipcMain.handle("getStateLookup", async () => {
			return _.cloneDeep(this.stateLookup);
		})
	}
}

module.exports = { PluginManager }