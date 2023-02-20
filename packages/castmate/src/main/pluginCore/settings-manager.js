import { callIpcFunc, ipcFunc } from "../utils/electronBridge"

import { PluginManager } from "../pluginCore/plugin-manager"

import fs from "fs"
import { secretsFilePath, settingsFilePath } from "../utils/configuration"
import YAML from "yaml"
import { WebServices } from "../webserver/webserver"

let settingsManager = null

export class SettingsManager {
	constructor() {
		this.settings = {}
		this.secrets = {}

		ipcFunc("settings", "getSettings", () => {
			return this.settings
		})

		ipcFunc("settings", "changeSettings", (pluginName, settings) => {
			return this.updateSettings(pluginName, settings)
		})

		ipcFunc("settings", "getSecrets", () => {
			return this.secrets
		})

		ipcFunc("settings", "changeSecrets", (pluginName, settings) => {
			return this.updateSecrets(pluginName, settings)
		})
	}

	async load() {
		const settingsText = await fs.promises.readFile(
			settingsFilePath,
			"utf-8"
		)
		this.settings = YAML.parse(settingsText)

		const secretsText = await fs.promises.readFile(secretsFilePath, "utf-8")
		this.secrets = YAML.parse(secretsText)
	}

	async updateSettings(pluginName, settings) {
		//Todo validate plugin name
		if (!(pluginName in this.settings)) {
			this.settings[pluginName] = {}
		}

		const oldSettings = this.settings[pluginName] || {}
		this.settings[pluginName] = settings

		await fs.promises.writeFile(
			settingsFilePath,
			YAML.stringify(this.settings),
			"utf-8"
		)

		const plugin = PluginManager.getInstance().getPlugin(pluginName)

		if (plugin) {
			plugin.updateSettings(this.settings[pluginName], oldSettings)
		} else if (pluginName == "castmate") {
			if (settings.port != oldSettings.port) {
				//Hardcode the port config
				WebServices.getInstance().updatePort(settings.port)
			}
		}

		callIpcFunc("settings_updateSettings", this.settings)
	}

	async updateSecrets(pluginName, secrets) {
		//Todo validate plugin name
		if (!(pluginName in this.secrets)) {
			this.secrets[pluginName] = {}
		}

		const oldSecrets = this.secrets[pluginName] || {}
		this.secrets[pluginName] = secrets

		await fs.promises.writeFile(
			secretsFilePath,
			YAML.stringify(this.secrets),
			"utf-8"
		)

		const plugin = PluginManager.getInstance().getPlugin(pluginName)

		if (plugin) {
			plugin.updateSettings(this.secrets[pluginName], oldSecrets)
		} else if (pluginName == "castmate") {
			if (settings.port != oldSettings.port) {
				//Hardcode the port config
				WebServices.getInstance().updatePort(settings.port)
			}
		}

		callIpcFunc("settings_updateSecrets", this.secrets)
	}

	/**
	 *
	 * @returns { SettingsManager }
	 */
	static getInstance() {
		if (!settingsManager) {
			settingsManager = new SettingsManager()
		}

		return settingsManager
	}
}
