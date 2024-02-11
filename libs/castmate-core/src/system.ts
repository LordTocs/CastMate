import { Profile } from "./profile/profile"
import { ActionQueue, ActionQueueManager } from "./queue-system/action-queue"
import { ResourceRegistry } from "./resources/resource-registry"
import { PluginManager } from "./plugins/plugin-manager"
import { ensureDirectory, resolveProjectPath, setProjectDirectory, initializeFileSystem } from "./io/file-system"
import { MediaManager } from "./media/media-manager"
import { ProfileManager } from "./profile/profile-system"
import { defineCallableIPC, defineIPCFunc } from "./util/electron"
import { Automation } from "./automation/automation"
import util from "util"
import { setupStreamPlans } from "./stream-plan/stream-plan"
import { globalLogger, initializeLogging } from "./logging/logging"

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
let setupComplete = false

export async function initializeCastMate() {
	await setProjectDirectory("../../user")
	await initializeLogging()
	globalLogger.log("Initing Castmate")
	await ensureDirectory(resolveProjectPath("settings"))
	await ensureDirectory(resolveProjectPath("secrets"))
	await initializeFileSystem()
	PluginManager.initialize()
	MediaManager.initialize()
	ResourceRegistry.initialize()
	setupStreamPlans()

	//How do we load plugins???
	//await loadPlugin("twitch")
	defineIPCFunc("castmate", "isSetupFinished", () => setupComplete)
}

const notifyRendererSetupFinished = defineCallableIPC<() => void>("castmate", "setupFinished")

export async function finializeCastMateSetup() {
	globalLogger.log("Finalizing Init")
	await Profile.initialize()
	await Automation.initialize()
	await ActionQueue.initialize()
	ActionQueueManager.initialize()
	ProfileManager.initialize()
	await ProfileManager.getInstance().finishSetup()
	globalLogger.log("CastMate Init Complete")
	setupComplete = true
	notifyRendererSetupFinished()
}
