import { Profile, setupProfiles } from "./profile/profile"
import { ActionQueue, ActionQueueManager } from "./queue-system/action-queue"
import { ResourceRegistry } from "./resources/resource-registry"
import { PluginManager } from "./plugins/plugin-manager"
import { ensureDirectory, resolveProjectPath, setProjectDirectory, initializeFileSystem } from "./io/file-system"
import { MediaManager, setupMedia } from "./media/media-manager"
import { ProfileManager } from "./profile/profile-system"
import { defineCallableIPC, defineIPCFunc } from "./util/electron"
import { Automation } from "./automation/automation"
import util from "util"
import { finishSettingUpStreamPlans, setupStreamPlans } from "./stream-plan/stream-plan"
import { globalLogger, initializeLogging } from "./logging/logging"
import { WebService } from "./webserver/internal-webserver"
import { PubSubManager } from "./pubsub/pubsub-service"
import { SequenceResolvers } from "./queue-system/sequence"
import { EmoteCache } from "./emotes/emote-service"
import { GenericLoginService } from "./util/generic-login"

import { app } from "electron"
import path from "path"

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

let initialSetupComplete = false
let setupComplete = false

export async function setupCastMateDirectories(isPortable: boolean) {
	if (isPortable) {
		await setProjectDirectory("../../user")
		await initializeLogging()
		const sessionPath = resolveProjectPath("chrome_sessions")
		globalLogger.log("Setting Session Folder to ", sessionPath)
		app.setPath("sessionData", sessionPath)
	} else {
		await setProjectDirectory(path.join(app.getPath("userData"), "user"))
		await initializeLogging()
	}
}

const notifyRendererInitialSetupFinished = defineCallableIPC<() => void>("castmate", "initialSetupFinished")

export async function initializeCastMate() {
	globalLogger.log("Initing Castmate")
	await ensureDirectory(resolveProjectPath("settings"))
	await ensureDirectory(resolveProjectPath("secrets"))
	await ensureDirectory(resolveProjectPath("state"))
	await initializeFileSystem()
	GenericLoginService.initialize()
	WebService.initialize()
	PluginManager.initialize()
	setupMedia()
	ResourceRegistry.initialize()
	PubSubManager.initialize()
	SequenceResolvers.initialize()
	EmoteCache.initialize()
	setupStreamPlans()

	//How do we load plugins???
	//await loadPlugin("twitch")
	defineIPCFunc("castmate", "isSetupFinished", () => setupComplete)
	defineIPCFunc("castmate", "isInitialSetupFinished", () => initialSetupComplete)

	initialSetupComplete = true
	notifyRendererInitialSetupFinished()
}

const notifyRendererSetupFinished = defineCallableIPC<() => void>("castmate", "setupFinished")

export async function loadAutomations() {
	await Automation.initialize()
}

export async function finializeCastMateSetup() {
	globalLogger.log("Finalizing Init")
	await setupProfiles()
	await finishSettingUpStreamPlans()
	await ActionQueue.initialize()
	ActionQueueManager.initialize()
	ProfileManager.initialize()
	await ProfileManager.getInstance().finishSetup()
	await EmoteCache.getInstance().initialize()
	globalLogger.log("CastMate Init Complete")
	setupComplete = true
	notifyRendererSetupFinished()
}
