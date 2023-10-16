import { Profile } from "./profile/profile"
import { ActionQueue, ActionQueueManager } from "./queue-system/action-queue"
import { ResourceRegistry } from "./resources/resource-registry"
import { Plugin } from "./plugins/plugin"
import { PluginManager } from "./plugins/plugin-manager"
import { ensureDirectory, resolveProjectPath, setProjectDirectory } from "./io/file-system"
import { MediaManager } from "./media/media-manager"
import { ProfileManager } from "./profile/profile-system"

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
	await ensureDirectory(resolveProjectPath("settings"))
	PluginManager.initialize()
	ResourceRegistry.initialize()
	MediaManager.initialize()

	await Profile.initialize()
	await ActionQueue.initialize()
	ActionQueueManager.initialize()

	ProfileManager.initialize()

	//How do we load plugins???
	//await loadPlugin("twitch")
}

export async function finializeCastMateSetup() {
	console.log("Finalizing Init")
	await ProfileManager.getInstance().finishSetup()
}
