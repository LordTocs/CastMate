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
import { InfoService } from "./info/info-manager"
import { AnalyticsService } from "./analytics/analytics-manager"
import { ViewerData } from "./viewer-data/viewer-data"

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

defineIPCFunc("castmate", "isSetupFinished", () => setupComplete)
defineIPCFunc("castmate", "isInitialSetupFinished", () => initialSetupComplete)

export async function setupCastMateDirectories(userOverride?: string) {
	const unpackaged = !app.isPackaged
	const portable = process.env.PORTABLE_EXECUTABLE_FILE != null || process.argv.includes("--portable")

	const userFolderName = userOverride ?? "user"

	let directory = path.join(app.getPath("userData"), userFolderName)
	const needsSession = unpackaged || portable

	if (portable) {
		directory = process.env.PORTABLE_EXECUTABLE_DIR
			? path.resolve(process.env.PORTABLE_EXECUTABLE_DIR, userFolderName)
			: `./${userFolderName}`
	} else if (unpackaged) {
		directory = `../../${userFolderName}`
	}

	await setProjectDirectory(directory)
	await initializeLogging()

	globalLogger.log("User Dir", resolveProjectPath("./"))

	if (needsSession) {
		const sessionPath = resolveProjectPath("chrome_sessions")
		globalLogger.log("Setting Session Folder to ", sessionPath)
		app.setPath("sessionData", sessionPath)
	}
}

const notifyRendererInitialSetupFinished = defineCallableIPC<() => void>("castmate", "initialSetupFinished")

export async function initializeCastMate() {
	globalLogger.log("Initing Castmate")
	AnalyticsService.initialize()
	await AnalyticsService.getInstance().initialize()
	await ensureDirectory(resolveProjectPath("settings"))
	await ensureDirectory(resolveProjectPath("secrets"))
	await ensureDirectory(resolveProjectPath("state"))
	await initializeFileSystem()
	InfoService.initialize()
	await InfoService.getInstance().checkInfo()
	GenericLoginService.initialize()
	WebService.initialize()
	PluginManager.initialize()
	setupMedia()
	ResourceRegistry.initialize()
	PubSubManager.initialize()
	SequenceResolvers.initialize()
	EmoteCache.initialize()
	setupStreamPlans()
	ViewerData.initialize()
	await ViewerData.getInstance().initialize()

	//How do we load plugins???
	//await loadPlugin("twitch")

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

export async function initializeCastMateSatellite() {
	globalLogger.log("Initing Castmate Satellite")
	AnalyticsService.initialize()
	await AnalyticsService.getInstance().initialize()
	await ensureDirectory(resolveProjectPath("settings"))
	await ensureDirectory(resolveProjectPath("secrets"))
	await ensureDirectory(resolveProjectPath("state"))
	await initializeFileSystem()
	//InfoService.initialize()
	//await InfoService.getInstance().checkInfo()
	GenericLoginService.initialize()
	//WebService.initialize()
	PluginManager.initialize()
	//setupMedia()
	ResourceRegistry.initialize()
	//PubSubManager.initialize()
	//SequenceResolvers.initialize()
	//EmoteCache.initialize()
	//setupStreamPlans()
	//ViewerData.initialize()
	//await ViewerData.getInstance().initialize()

	//How do we load plugins???
	//await loadPlugin("twitch")

	initialSetupComplete = true
	notifyRendererInitialSetupFinished()
}

export async function finializeCastMateSatelliteSetup() {
	globalLogger.log("Finalizing Init")
	//await setupProfiles()
	//await finishSettingUpStreamPlans()
	//await ActionQueue.initialize()
	//ActionQueueManager.initialize()
	//ProfileManager.initialize()
	//await ProfileManager.getInstance().finishSetup()
	//await EmoteCache.getInstance().initialize()
	globalLogger.log("CastMate Init Complete")
	setupComplete = true
	notifyRendererSetupFinished()
}
