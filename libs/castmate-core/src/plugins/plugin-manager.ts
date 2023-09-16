import { IPCPluginDefinition } from "castmate-schema"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { Service } from "../util/service"
import { Plugin } from "./plugin"

const rendererRegisterPlugin = defineCallableIPC<(plugin: IPCPluginDefinition) => void>("plugins", "registerPlugin")
const rendererUnregisterPlugin = defineCallableIPC<(id: string) => void>("plugins", "unregisterPlugin")

defineIPCFunc("plugins", "getPluginIds", () => {
	const ids = PluginManager.getInstance().pluginIds
	return ids
})

defineIPCFunc("plugins", "getPlugin", (id: string) => {
	return PluginManager.getInstance().getPlugin(id)?.toIPC()
})

defineIPCFunc("plugins", "uiLoadComplete", () => {
	PluginManager.getInstance().signalUILoadComplete()
})

export const PluginManager = Service(
	class {
		private plugins: Map<string, Plugin> = new Map()

		constructor() {}

		get pluginIds() {
			return [...this.plugins.keys()]
		}

		async registerPlugin(plugin: Plugin) {
			this.plugins.set(plugin.id, plugin)
			console.log("Loading Plugin", plugin.id)
			if (!(await plugin.load())) {
				console.error("Load failed for", plugin.id)
				this.plugins.delete(plugin.id)
				return
			}
			rendererRegisterPlugin(plugin.toIPC())
		}

		async unregisterPlugin(id: string) {
			const plugin = this.plugins.get(id)

			if (!plugin) {
				throw new Error("Attempt to unregister non-existant plugin")
			}

			await plugin.unload()
			this.plugins.delete(id)
			rendererUnregisterPlugin(id)
		}

		async signalUILoadComplete() {
			for (let plugin of this.plugins.values()) {
				plugin.onUILoaded()
			}
		}

		getAction(plugin: string, action: string) {
			return this.plugins.get(plugin)?.actions?.get(action)
		}

		getTrigger(plugin: string, trigger: string) {
			return this.plugins.get(plugin)?.triggers?.get(trigger)
		}

		getPlugin(id: string) {
			return this.plugins.get(id)
		}
	}
)
