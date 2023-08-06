import { Profile } from "./profile/profile"
import { ActionQueue } from "./queue-system/action-queue"
import { ResourceRegistry } from "./resources/resource-registry"
import { Plugin } from "./plugins/plugin"
import { PluginManager } from "./plugins/plugin-manager"

/*
//This shit is dynamic and vite hates it.
export async function loadPlugin(name: string) {
	try {
		const module = await import(`castmate-plugin-${name}-main`)
		const plugin = module.default as Plugin

		PluginManager.getInstance().registerPlugin(plugin)
	} catch (e) {
		console.error("Failed to load plugin", name)
		console.error(e)
	}
}
*/

export async function initializeCastMate() {
	console.log("Initing CastMate")
	PluginManager.initialize()
	ResourceRegistry.initialize()

	Profile.initialize()
	ActionQueue.initialize()

	//How do we load plugins???
	//await loadPlugin("twitch")
}