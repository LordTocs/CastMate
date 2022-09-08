import { manualDependency } from './conditionals.js';
import { Plugin } from './plugin.js'
import { reactiveCopy, Watcher, deleteReactiveProperty } from './reactive.js'
import { ipcMain } from "./electronBridge.js"
import _ from 'lodash'
import logger from './logger.js';

export class PluginManager {
	async load(ipcSender) {
		let pluginFiles = [
			"inputs",
			"hue",
			"notifications",
			"obs",
			"sounds",
			"twitch",
			"minecraft",
			"time",
			"kofi",
			//"csgo",
			"variables",
			"websocket",
			//"aoe3",
			"aoe4",
			"twinkly",
			"websocketActions"
		]

		//Todo: This relative require is weird.
		this.plugins = [];
		for (let file of pluginFiles)
		{
			try {
				this.plugins.push(new Plugin((await import(`../plugins/${file}.js`)).default))
			}
			catch(err) {
				logger.error(`Error Importing ${file} Plugin. `);
				logger.error(err);
			}
		}
		this.stateLookup = {};

		for (let plugin of this.plugins) {
			this.stateLookup[plugin.name] = {};
			reactiveCopy(this.stateLookup[plugin.name], plugin.pluginObj.state)
		}

		this.templateFunctions = {};
		for (let plugin of this.plugins) {
			this.templateFunctions[plugin.name] = plugin.templateFunctions;
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
		if (!this.stateLookup[pluginObj.name]) {
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
		deleteReactiveProperty(this.stateLookup[pluginName], stateKey);
		this.ipcSender.send('state-removal', { [pluginName]: stateKey });
	}

	async init(settings, secrets, actions, profiles, webServices, analytics) {
		for (let plugin of this.plugins) {
			try {
				await plugin.init(settings, secrets, actions, profiles, webServices, analytics, this);
			}
			catch (err) {
				console.error(err);
			}
		}

		ipcMain.handle("getPlugins", async () => {
			const pluginInfo = {};
			for (let plugin of this.plugins) {
				pluginInfo[plugin.name] = plugin.getUIDescription();
			} 
			return pluginInfo;
		})

		ipcMain.handle("getStateLookup", async () => {
			return _.cloneDeep(this.stateLookup);
		})
	}
}
