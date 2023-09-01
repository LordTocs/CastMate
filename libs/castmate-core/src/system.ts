import { Profile } from "./profile/profile"
import { ActionQueue, ActionQueueManager } from "./queue-system/action-queue"
import { ResourceRegistry } from "./resources/resource-registry"
import { Plugin } from "./plugins/plugin"
import { PluginManager } from "./plugins/plugin-manager"
import { setProjectDirectory } from "./io/file-system"
import { MediaManager } from "./media/media-manager"

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
	await setProjectDirectory("../../user")
	PluginManager.initialize()
	ResourceRegistry.initialize()
	MediaManager.initialize()

	Profile.initialize()
	ActionQueue.initialize()
	ActionQueueManager.initialize()

	//How do we load plugins???
	//await loadPlugin("twitch")
}
