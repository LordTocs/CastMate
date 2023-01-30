import { AutomationManager } from "./automations/automation-manager.js"
import { Analytics } from "./utils/analytics.js"
import logger from "./utils/logger.js"

import { ensureUserFolder, secretsFilePath, settingsFilePath } from "./utils/configuration.js";
import { ActionQueue } from "./actions/action-queue.js"
import { ProfileManager } from "./actions/profile-manager.js"
import { WebServices } from "./webserver/webserver.js"
import { PluginManager } from "./pluginCore/plugin-manager.js"
import _ from 'lodash'
import { ipcMain, app, setIpcSender, ipcFunc } from "./utils/electronBridge.js"

import { ResourceManager } from './resources/resource-manager.js'
import { OverlayManager }  from './overlays/overlay-manager.js'
import { osInit } from './utils/os.js'
import { StateManager } from "./state/state-manager.js";
import { RemoteTemplateManager } from "./state/remote-template.js";
import { SettingsManager } from "./pluginCore/settings-manager.js";
import { StreamPlanManager } from "./planner/streamPlan.js";

async function initInternal(mainWindowSender) {
	logger.info(`Starting CastMate v${app.getVersion()}`);

	setIpcSender(mainWindowSender);

	ensureUserFolder();

	osInit();

	SettingsManager.getInstance().load();

	let plugins = PluginManager.getInstance();
	await plugins.load();

	const stateManager = StateManager.getInstance();
	await stateManager.loadSerialized();

	//Force remote template manager creation
	RemoteTemplateManager.getInstance();

	await AutomationManager.getInstance().load();

	const actions = ActionQueue.getInstance();

	const webServices = WebServices.getInstance();

	const profiles = new ProfileManager(actions, plugins);

	//Let loose the web server
	webServices.start();

	const analytics = new Analytics();

	await ResourceManager.getInstance().initialize()

	await OverlayManager.getInstance().init()
	await StreamPlanManager.getInstance().init()

	await plugins.init(actions, profiles, analytics);

	stateManager.finishLoad();

	await profiles.load();

	analytics.track("openApp");

	webServices.startWebsockets();
}


export async function initCastMate(mainWindowSender) {
	let initPromise = initInternal(mainWindowSender);

	ipcFunc("core", "waitForInit", async () => {
		return await initPromise;
	})	

	await initPromise;
}

