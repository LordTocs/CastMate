import { Plugin } from './plugin.js'
import { ipcMain } from "../utils/electronBridge.js"
import _ from 'lodash'
import logger from '../utils/logger.js';

let pluginManager = null;
export class PluginManager {
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

	async load() {
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
	}

	async init(actions, profiles, analytics) {
		for (let plugin of this.plugins) {
			try {
				await plugin.init(actions, profiles, analytics, this);
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
}
