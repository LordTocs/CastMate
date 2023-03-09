import { AutomationManager } from "./automations/automation-manager.js"
import { Analytics } from "./utils/analytics.js"
import logger from "./utils/logger.js"

import {
	ensureUserFolder,
	secretsFilePath,
	settingsFilePath,
} from "./utils/configuration.js"
import { ActionQueue } from "./actions/action-queue.js"
import { ProfileManager } from "./actions/profile-manager.js"
import { WebServices } from "./webserver/webserver.js"
import { PluginManager } from "./pluginCore/plugin-manager.js"
import _ from "lodash"
import { ipcMain, app, setMainWindow, ipcFunc } from "./utils/electronBridge.js"

import { ResourceManager } from "./resources/resource-manager.js"
import { OverlayManager } from "./overlays/overlay-manager.js"
import { osInit } from "./utils/os.js"
import { StateManager } from "./state/state-manager.js"
import { RemoteTemplateManager } from "./state/remote-template.js"
import { SettingsManager } from "./pluginCore/settings-manager.js"
import { StreamPlanManager } from "./planner/streamPlan.js"
import { IoTManager } from "./iot/iot-manager.js"

async function initInternal(mainWindowSender) {
	logger.info(`Starting CastMate v${app.getVersion()}`)

	setMainWindow(mainWindowSender)

	ensureUserFolder()

	osInit()

	SettingsManager.getInstance().load()

	const stateManager = StateManager.getInstance()
	await stateManager.loadSerialized()

	let plugins = PluginManager.getInstance()
	await plugins.load()

	//Force remote template manager creation
	RemoteTemplateManager.getInstance()

	await AutomationManager.getInstance().load()

	const actions = ActionQueue.getInstance()

	const webServices = WebServices.getInstance()

	const profiles = new ProfileManager(actions, plugins)

	//Let loose the web server
	webServices.start()

	const analytics = Analytics.getInstance();

	await ResourceManager.getInstance().initialize()
	await OverlayManager.getInstance().init()
	await StreamPlanManager.getInstance().init()

	await plugins.init(actions, profiles, analytics)

	await IoTManager.getInstance().init()

	stateManager.finishLoad()

	await profiles.load()

	analytics.track("openApp")

	webServices.startWebsockets()
}

export async function initCastMate(mainWindow) {
	let initPromise = initInternal(mainWindow)

	ipcFunc("core", "waitForInit", async () => {
		return await initPromise
	})

	await initPromise
}
