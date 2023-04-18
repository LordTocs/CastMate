import { Plugin } from "./plugin.js"
import { ipcFunc, ipcMain } from "../utils/electronBridge.js"
import _ from "lodash"
import logger from "../utils/logger.js"
import util from "util"

let pluginManager = null
export class PluginManager {
	/**
	 *
	 * @returns {PluginManager}
	 */
	static getInstance() {
		if (!pluginManager) {
			pluginManager = new this()
		}
		return pluginManager
	}

	async load() {
		let pluginFiles = [
			"twitch",
			"spellcast",
			"obs",
			"overlays",
			"sounds",
			"iot",
			"inputs",
			"discord",
			"minecraft",
			"voicemod",
			"variables",
			"time",
			"kofi",
			"http",
			"os",
			//"csgo",

			//"aoe3",
			"aoe4",
			"hue",
			"twinkly",
			"tplink",
			"coh3",
		]

		//Todo: This relative require is weird.
		this.plugins = []

		this.plugins = await Promise.all(
			pluginFiles.map(async (file) => {
				let plugin = null
				try {
					plugin = new Plugin(
						(await import(`../plugins/${file}.js`)).default
					)
				} catch (err) {
					logger.error(`Error Importing ${file} Plugin. `)
					logger.error(`Error: ${util.inspect(err)}`)
				}
				return plugin
			})
		)

		this.plugins = this.plugins.filter((p) => !!p)

		this.templateFunctions = {}
		for (let plugin of this.plugins) {
			if (!plugin) continue
			this.templateFunctions[plugin.name] = plugin.templateFunctions
		}
	}

	async init(actions, profiles, analytics) {
		for (let plugin of this.plugins) {
			try {
				await plugin.init(actions, profiles, analytics, this)
			} catch (err) {
				console.error(err)
			}
		}

		ipcFunc("core", "getPlugins", () => {
			const pluginInfo = {}
			for (let plugin of this.plugins) {
				pluginInfo[plugin.name] = plugin.getUIDescription()
			}
			return pluginInfo
		})
	}

	/**
	 *
	 * @param {String} name
	 * @returns {Plugin}
	 */
	getPlugin(name) {
		return this.plugins.find((p) => p.name == name)
	}
}
