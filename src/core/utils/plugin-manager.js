const { manualDependency } = require('./conditionals');
const { Plugin } = require('./plugin');
const { reactiveCopy, Watcher, deleteReactiveProperty } = require('./reactive');
const { ipcMain } = require("electron");
const _ = require('lodash');

class PluginManager
{
	async load(ipcSender)
	{
		let pluginFiles = [
			"inputs",
			"lights",
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

		for (let plugin of this.plugins)
		{
			reactiveCopy(this.combinedState, plugin.pluginObj.state);
		}

		this.combinedTemplateFunctions = {}
		for (let plugin of this.plugins)
		{
			Object.assign(this.combinedTemplateFunctions, plugin.templateFunctions);
		}

		this.ipcSender = ipcSender;
	}

	setupReactivity()
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

				if (this.ipcSender)
				{
					this.ipcSender.send('state-update', { [stateKey]: this.combinedState[stateKey] });
				}

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

				if (this.ipcSender)
				{
					this.ipcSender.send('state-update', { [newKey]: this.combinedState[newKey] });
				}
			}, { fireImmediately: false })

			manualDependency(this.combinedState, watcher, newKey);

			if (this.ipcSender)
			{
				this.ipcSender.send('state-update', { [newKey]: this.combinedState[newKey] });
			}
		});
	}

	removeReactiveValue(valueName)
	{
		deleteReactiveProperty(this.combinedState, valueName);
		this.ipcSender.send('state-removal', valueName);
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

		ipcMain.handle("getCombinedState", async () => 
		{
			return _.cloneDeep(this.combinedState);
		})
	}
}

module.exports = { PluginManager }