import { IPCPluginDefinition } from "castmate-schema"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { Service } from "../util/service"
import { Plugin } from "./plugin"
import { deserializeSchema } from "../util/ipc-schema"
import { Profile } from "../profile/profile"
import { aliasReactiveValue, reactify } from "../reactivity/reactivity"
import { globalLogger, usePluginLogger } from "../logging/logging"

const rendererRegisterPlugin = defineCallableIPC<(plugin: IPCPluginDefinition) => void>("plugins", "registerPlugin")
const rendererUnregisterPlugin = defineCallableIPC<(id: string) => void>("plugins", "unregisterPlugin")

defineIPCFunc("plugins", "getPluginIds", () => {
	const ids = PluginManager.getInstance().pluginIds
	return ids
})

defineIPCFunc("plugins", "getPlugin", async (id: string) => {
	return await PluginManager.getInstance().getPlugin(id)?.toIPC()
})

defineIPCFunc("plugins", "uiLoadComplete", () => {
	PluginManager.getInstance().signalUILoadComplete()
})

interface SettingsChange {
	pluginId: string
	settingId: string
	value: any
}

defineIPCFunc("plugins", "updateSettings", async (changes: SettingsChange[]) => {
	const plugins = PluginManager.getInstance()
	for (const change of changes) {
		const plugin = plugins.getPlugin(change.pluginId)
		if (!plugin) continue
		const setting = plugin.settings.get(change.settingId)
		if (setting?.type != "value" && setting?.type != "secret") continue
		setting.ref.value = await deserializeSchema(setting.schema, change.value)
	}
})

export const PluginManager = Service(
	class {
		private plugins: Map<string, Plugin> = new Map()
		private uiLoaded: boolean = false

		constructor() {
			this.pluginState = reactify({})
		}

		get pluginIds() {
			return [...this.plugins.keys()]
		}

		private pluginState: Record<string, object>
		get state() {
			return this.pluginState
		}

		injectState(plugin: Plugin) {
			if (plugin.id in this.pluginState) return
			this.pluginState[plugin.id] = plugin.stateContainer
		}

		async registerPlugin(plugin: Plugin) {
			this.plugins.set(plugin.id, plugin)
			const logger = usePluginLogger(plugin.id)
			logger.log("Loading Plugin", plugin.id)
			try {
				if (!(await plugin.load())) {
					logger.error("Load failed for", plugin.id)
					this.plugins.delete(plugin.id)
					return
				}
				rendererRegisterPlugin(await plugin.toIPC())
			} catch (err) {
				logger.error("Load REALLY failed for", plugin.id)
				logger.error(err)

				//Remove broken plugins
				this.plugins.delete(plugin.id)
				delete this.pluginState[plugin.id]
			}
		}

		async unregisterPlugin(id: string) {
			const plugin = this.plugins.get(id)

			if (!plugin) {
				throw new Error("Attempt to unregister non-existant plugin")
			}

			await plugin.unload()
			this.plugins.delete(id)
			delete this.pluginState[id]
			rendererUnregisterPlugin(id)
		}

		async onProfilesChanged(activeProfiles: Profile[], inactiveProfiles: Profile[]) {
			for (const plugin of this.plugins.values()) {
				await plugin.onProfilesChanged(activeProfiles, inactiveProfiles)
			}
		}

		async signalUILoadComplete() {
			if (this.uiLoaded) return
			this.uiLoaded = true
			for (let plugin of this.plugins.values()) {
				plugin.onUILoaded()
			}
		}

		get isUILoaded() {
			return this.uiLoaded
		}

		getAction(plugin: string, action: string) {
			return this.plugins.get(plugin)?.actions?.get(action)
		}

		getTrigger(plugin: string, trigger: string) {
			return this.plugins.get(plugin)?.triggers?.get(trigger)
		}

		getState(plugin: string, state: string) {
			return this.plugins.get(plugin)?.state?.get(state)
		}

		getPlugin(id: string) {
			return this.plugins.get(id)
		}
	}
)
