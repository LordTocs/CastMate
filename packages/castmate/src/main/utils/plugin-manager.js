import { manualDependency } from './conditionals.js';
import { Plugin } from './plugin.js'
import { reactiveCopy, Watcher, deleteReactiveProperty } from '../state/reactive.js'
import { ipcMain } from "./electronBridge.js"
import _ from 'lodash'
import logger from './logger.js';

let pluginManager = null;

export class PluginManager {
	async load(ipcSender) {
		let pluginFiles = [
			"inputs",
			"hue",
			"notifications",
			"obs",
			"sounds",
			"twitch",
			"spellcast",
			"minecraft",
			"voicemod",
			"time",
			"kofi",
			"http",
			"os",
			//"csgo",
			"variables",
			"websocket",
			//"aoe3",
			"aoe4",
			"twinkly",
			
		]

		//Todo: This relative require is weird.
		this.plugins = [];

		this.plugins = await Promise.all(pluginFiles.map(async file => {
			let plugin = null;
			try {
				plugin = new Plugin((await import(`../plugins/${file}.js`)).default)
			}
			catch(err) {
				logger.error(`Error Importing ${file} Plugin. `);
				logger.error(err);
			}
			return plugin
		}))

		this.templateFunctions = {};
		for (let plugin of this.plugins) {
			this.templateFunctions[plugin.name] = plugin.templateFunctions;
		}

		this.ipcSender = ipcSender;
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
	}

	/**
	 * 
	 * @param {String} name 
	 * @returns {Plugin}
	 */
	getPlugin(name) {
		return this.plugins.find(p => p.name == name);
	}

	/**
	 * 
	 * @returns {PluginManager}
	 */
	static getInstance() {
        if (!pluginManager)
        {
            pluginManager = new this();
        }
        return pluginManager;
    }
}
