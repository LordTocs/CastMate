import { AutomationManager } from "./automations/automation-manager.js"
import { Analytics } from "./utils/analytics.js"
import logger from "./utils/logger.js"

import { ensureUserFolder, secretsFilePath, settingsFilePath } from "./utils/configuration.js";
import { ActionQueue } from "./actions/action-queue.js"
import { ProfileManager } from "./actions/profile-manager.js"
import { WebServices } from "./webserver/webserver.js"
import { PluginManager } from "./pluginCore/plugin-manager.js"
import _ from 'lodash'
import { ipcMain, app, setIpcSender } from "./utils/electronBridge.js"

import { ResourceManager } from './resources/resource-manager.js'
import { OverlayManager }  from './overlays/overlay-manager.js'
import { osInit } from './utils/os.js'
import { RemoteTemplateManager } from "./state/remote-template.js";
import { SettingsManager } from "./pluginCore/settings-manager.js";

async function initInternal(mainWindowSender) {
	logger.info(`Starting CastMate v${app.getVersion()}`);

	setIpcSender(mainWindowSender);

	ensureUserFolder();

	osInit();

	SettingsManager.getInstance().load();

	let plugins = PluginManager.getInstance();
	await plugins.load();

	RemoteTemplateManager.getInstance();

	const automations = new AutomationManager();
	await automations.load();

	const actions = new ActionQueue(plugins, automations);

	const webServices = WebServices.getInstance();

	const profiles = new ProfileManager(actions, plugins);

	//Let loose the web server
	webServices.start();

	const analytics = new Analytics();

	await ResourceManager.getInstance().initialize()

	await OverlayManager.getInstance().init()

	await plugins.init(actions, profiles, analytics);

	await profiles.load();

	analytics.track("openApp");

	webServices.startWebsockets();
}


export async function initCastMate(mainWindowSender) {
	let initPromise = initInternal(mainWindowSender);

	ipcMain.handle('waitForInit', async () => {
		return await initPromise;
	})

	await initPromise;
}

