import { Service } from "../util/service"
import { Plugin } from "./plugin"

export const PluginManager = Service(
	class {
		private plugins: Map<string, Plugin> = new Map()

		constructor() {}

		registerPlugin(plugin: Plugin) {
			this.plugins.set(plugin.name, plugin)
		}

		load() {
			for (let [key, plugin] of this.plugins) {
				plugin.load()
			}
		}

		getAction(plugin: string, action: string) {
			return this.plugins.get(plugin)?.actions?.get(action)
		}

		getTrigger(plugin: string, trigger: string) {
			return this.plugins.get(plugin)?.triggers?.get(trigger)
		}
	}
)
