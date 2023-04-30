import { Resource } from "../resources/resource"
import _flatten from "lodash/flatten"
import { PluginManager } from "../pluginCore/plugin-manager"
import logger from "../utils/logger"

export class Light {
	_getPlugin() {
		const plugin = IoTManager.getInstance().providers[this.config.plugin]
		return plugin
	}

	static async create(config) {
		return null
	}

	static async load() {
		const providers = Object.values(IoTManager.getInstance().providers)
		const providerArrays = await Promise.all(
			providers.map((p) => p.loadLights())
		)
		return _flatten(providerArrays)
	}

	async setLightState(on, color, duration) {}
}

export class Plug {
	_getPlugin() {
		const plugin = IoTManager.getInstance().providers[this.config.plugin]
		return plugin
	}

	static async create(config) {
		return null
	}

	static async load() {
		const providers = Object.values(IoTManager.getInstance().providers)
		const providerArrays = await Promise.all(
			providers.map((p) => p.loadPlugs())
		)
		return _flatten(providerArrays)
	}

	async setPlugState(on) {}
}

export class IoTProvider {
	constructor(pluginName) {
		this._pluginName = pluginName
		this._manager = null
	}

	get inited() {
		return !!this._manager
	}

	async loadPlugs() {}

	async loadLights() {}

	async initServices() {}

	async _addNewPlug(plug) {
		await this._manager.plugs.inject(plug)
	}

	async _addNewLight(light) {
		await this._manager.lights.inject(light)
	}

	async _removePlug(plug) {
		await this._manager.plugs.deleteById(plug.id)
	}

	async _removeLight(light) {
		await this._manager.lights.deleteById(light.id)
	}

	async clearResources() {
		if (!this._manager) return

		const lights = this._manager.lights.resources.filter(
			(l) => l.config.plugin == this._pluginName
		)
		const plugs = this._manager.plugs.resources.filter(
			(l) => l.config.plugin == this._pluginName
		)

		await this._manager.lights.deleteMany(lights.map((l) => l.id))
		await this._manager.plugs.deleteMany(plugs.map((p) => p.id))
	}

	get lights() {
		return this._manager.lights.resources.filter(
			(l) => l.config.plugin == this._pluginName
		)
	}

	get plugs() {
		return this._manager.plugs.resources.filter(
			(l) => l.config.plugin == this._pluginName
		)
	}
}

let iotManager = null
export class IoTManager {
	/**
	 *
	 * @returns {IoTManager}
	 */
	static getInstance() {
		if (!iotManager) {
			iotManager = new this()
		}
		return iotManager
	}

	constructor() {
		this.lights = new Resource(Light, {
			type: "light",
			name: "Smart Light",
			description: "A Smart Light / Smart Light Like Object",
			config: {
				type: Object,
				properties: {
					name: { type: String },
					plugin: { type: String },
				},
			},
		})

		this.plugs = new Resource(Plug, {
			type: "plug",
			name: "Smart Plug",
			description: "One smart plug",
			config: {
				type: Object,
				properties: {
					name: { type: String },
					plugin: { type: String },
				},
			},
		})

		this.providers = {}
	}

	async init() {
		const plugins = PluginManager.getInstance()

		const serviceInits = []
		for (let plugin of plugins.plugins) {
			if (plugin?.pluginObj?.iotProvider) {
				logger.info(`Found iotProvider in ${plugin.name}`)
				const provider = plugin.pluginObj.iotProvider
				this.providers[plugin.name] = provider
				provider._manager = this
				serviceInits.push(
					provider
						.initServices()
						.catch((err) =>
							console.error(
								"Error Initing",
								plugin.name,
								"IotProvider",
								err
							)
						)
				)
			}
		}

		await Promise.all(serviceInits)

		await this.lights.load()
		await this.plugs.load()
	}
}
