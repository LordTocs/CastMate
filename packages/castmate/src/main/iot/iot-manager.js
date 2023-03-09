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
        const providerArrays = await Promise.all(providers.map(p => p.loadLights()))
        return _flatten(providerArrays)
    }

    async setLightState(on, color, duration) {

    }
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
        const providerArrays = await Promise.all(providers.map(p => p.loadPlugs()))
        return _flatten(providerArrays)
    }

    async setPlugState(newState) {
        
    }

    async togglePlugState() {

    }
}

export class IoTProvider {

    async loadPlugs() {

    }

    async loadLights() {

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
                    spectrum: {
                        type: Object,
                        properties: {
                            color: { },
                            white: { },
                        }
                    }
                }
            }
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
                }
            }
        })

        this.providers = {}
    }

    async init()     {
        const plugins = PluginManager.getInstance()

        for (let plugin of plugins.plugins) {
            if (plugin?.pluginObj?.iotProvider) {
                logger.info(`Found iotProvider in ${plugin.name}`)
                this.providers[plugin.name] = plugin.pluginObj.iotProvider
            }
        }

        await this.lights.load()
        await this.plugs.load()
    }
}