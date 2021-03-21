const { manualDependency } = require('./conditionals');
const { Plugin } = require('./plugin');
const { reactiveCopy, Watcher } = require('./reactive');
const { ipcMain } = require("electron");
class PluginManager
{
	async load()
	{
		let pluginFiles = [
			"inputs",
			"lights",
			"notifications",
			"obs",
			"sounds",
			"minecraft",
			"tts",
			"twitch",
			"variables",
			"websocket"
		]

		//Todo: This relative require is weird.
		this.plugins = pluginFiles.map((file) => new Plugin(require(`../plugins/${file}`)));

		this.combinedState = {};

		for (let plugin of this.plugins)
		{
			reactiveCopy(this.combinedState, plugin.pluginObj.state);
		}
	}

	setupWebsocketReactivity()
	{
		for (let stateKey in this.combinedState)
		{
			let watcher = new Watcher(() =>
			{
				this.webServices.websocketServer.broadcast(JSON.stringify({
					state: {
						[stateKey]: this.combinedState[stateKey]
					}
				}))
			}, { fireImmediately: false })
			manualDependency(this.combinedState, watcher, stateKey);
		}
	}

	updateReactivity(pluginObj)
	{
		reactiveCopy(this.combinedState, pluginObj.state, (newKey) =>
		{
			let watcher = new Watcher(() =>
			{
				this.webServices.websocketServer.broadcast(JSON.stringify({
					state: {
						[newKey]: this.combinedState[newKey]
					}
				}))
			}, { fireImmediately: false })
			manualDependency(this.combinedState, watcher, newKey);
		});
	}

	async init(settings, secrets, actions, profiles, webServices)
	{
		for (let plugin of this.plugins)
		{
			try
			{
				await plugin.init(settings, secrets, actions, profiles, webServices, this);
			}
			catch (err)
			{
				console.error(err);
			}
		}

		ipcMain.handle("getPlugins", async () =>
		{
			let pluginInfo = this.plugins.map((plugin) => plugin.getUIDescription());
			return pluginInfo;
		})
	}
}

module.exports = { PluginManager }