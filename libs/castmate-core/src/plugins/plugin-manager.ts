import { timeout } from "../util/abort-utils"
import { EventList } from "../util/events"
import { DefaultService, Service } from "../util/service"
import { Plugin, PluginEventHandlers } from "./plugin"

import assert from "node:assert"

// const rendererRegisterPlugin = defineCallableIPC<(plugin: IPCPluginDefinition) => void>("plugins", "registerPlugin")
// const rendererUnregisterPlugin = defineCallableIPC<(id: string) => void>("plugins", "unregisterPlugin")

// defineIPCFunc("plugins", "getPluginIds", () => {
// 	const ids = PluginManager.getInstance().pluginIds
// 	return ids
// })

// defineIPCFunc("plugins", "getPlugin", async (id: string) => {
// 	return await PluginManager.getInstance().getPlugin(id)?.toIPC()
// })

// defineIPCFunc("plugins", "uiLoadComplete", () => {
// 	PluginManager.getInstance().signalUILoadComplete()
// })

/*
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
*/

interface PluginLoader {
	plugin: Plugin
	dependenciesRemaining: number
	dependentPluginLoaders: PluginLoader[]
	didLoad: boolean
}

export const PluginManager = DefaultService(
	class {
		private plugins: Map<string, Plugin> = new Map()
		private pluginEvents: Map<string, PluginEventHandlers> = new Map()
		private uiLoaded: boolean = false

		constructor() {
			// this.pluginState = reactify({})
		}

		get pluginIds() {
			return [...this.plugins.keys()]
		}

		//private pluginState: Record<string, object>
		get state() {
			//return this.pluginState
			return {}
		}

		async registerPlugin(plugin: Plugin) {
			this.plugins.set(plugin.spec.id, plugin)
			// const logger = usePluginLogger(plugin.id)
			// logger.log("Loading Plugin", plugin.id)
			// const startTime = Date.now()
			// try {
			// 	if (!(await plugin.load())) {
			// 		logger.error("Load failed for", plugin.id)
			// 		this.plugins.delete(plugin.id)
			// 		return
			// 	}
			// 	rendererRegisterPlugin(await plugin.toIPC())
			// } catch (err) {
			// 	logger.error("Load REALLY failed for", plugin.id)
			// 	logger.error(err)

			// 	//Remove broken plugins
			// 	this.plugins.delete(plugin.id)
			// 	delete this.pluginState[plugin.id]
			// } finally {
			// 	const endTime = Date.now()

			// 	const deltaTime = endTime - startTime
			// 	logger.log("Finished Loading", plugin.id, "in", deltaTime / 1000, "seconds")
			// }
		}

		async unregisterPlugin(id: string) {
			// const plugin = this.plugins.get(id)
			// if (!plugin) {
			// 	throw new Error("Attempt to unregister non-existant plugin")
			// }
			// await plugin.unload()
			// this.plugins.delete(id)
			// delete this.pluginState[id]
			// rendererUnregisterPlugin(id)
		}

		// async signalUILoadComplete() {
		// 	if (this.uiLoaded) return
		// 	this.uiLoaded = true
		// 	for (let plugin of this.plugins.values()) {
		// 		plugin.onUILoaded()
		// 	}
		// }

		get isUILoaded() {
			return this.uiLoaded
		}

		// getAction(plugin: string, action: string) {
		// 	return this.plugins.get(plugin)?.actions?.get(action)
		// }

		// getTrigger(plugin: string, trigger: string) {
		// 	return this.plugins.get(plugin)?.triggers?.get(trigger)
		// }

		getState(plugin: string, state: string) {
			return undefined as any //this.plugins.get(plugin)?.state?.get(state)
		}

		getPlugin(id: string) {
			return this.plugins.get(id)
		}

		getPluginEvents(id: string) {
			const existing = this.pluginEvents.get(id)
			if (existing) return existing
			const events: PluginEventHandlers = {
				loader: new EventList(),
				unloader: new EventList(),
				uiloader: new EventList(),
				profilesChanged: new EventList(),
			}
			this.pluginEvents.set(id, events)
			return events
		}

		async loadPlugins() {
			const loaders = new Map<string, PluginLoader>()

			const getOrCreateLoader = (id: string) => {
				if (loaders.has(id)) {
					const loader = loaders.get(id)
					assert(loader)
					return loader
				}
				const plugin = this.plugins.get(id)
				assert(plugin, `Plugin ${id} doesn't exist!`)
				const loader: PluginLoader = {
					plugin,
					dependenciesRemaining: 0,
					dependentPluginLoaders: [],
					didLoad: false,
				}
				loaders.set(id, loader)
				return loader
			}

			for (const plugin of this.plugins.values()) {
				const loader = getOrCreateLoader(plugin.spec.id)

				for (const dep of plugin.spec.dependencies) {
					const depLoader = getOrCreateLoader(dep)
					depLoader.dependentPluginLoaders.push(loader)
					loader.dependenciesRemaining++

					//TODO: Check for circular deps!
				}
			}

			const doLoad = async (loader: PluginLoader) => {
				assert(loader.dependenciesRemaining == 0)
				try {
					await Promise.race([loader.plugin.load(), timeout(180000)])
				} finally {
					loader.didLoad = true
				}
				for (const dep of loader.dependentPluginLoaders) {
					dep.dependenciesRemaining--
				}
			}

			while (true) {
				const loadPromises = new Array<Promise<any>>()

				for (const loader of loaders.values()) {
					if (loader.dependenciesRemaining == 0 && !loader.didLoad) {
						loadPromises.push(doLoad(loader))
					}
				}

				if (loadPromises.length == 0) break

				await Promise.allSettled(loadPromises)
			}
		}
	}
)
