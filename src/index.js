const { app, BrowserWindow } = require("electron");
const serve = require('electron-serve');
const loadURL = serve({directory: './electron/castmate-frontend/dist'});
const { ActionQueue } = require("./actions/action-queue.js");
const { ProfileManager } = require("./actions/profile-manager.js");
const { Profile } = require("./actions/profiles.js");
const { Plugin } = require('./utils/plugin.js');
const HotReloader = require('./utils/hot-reloader.js');
const { createWebServices } = require("./utils/webserver.js");
const fs = require('fs');
const path = require('path');
const { PluginManager } = require("./utils/plugin-manager.js");


async function createWindow()
{
	let mainWindow;
	mainWindow = new BrowserWindow();
	await loadURL(mainWindow);
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(async () =>
{
	// launch electron
	await createWindow();

	let plugins = new PluginManager();
	await plugins.load();

	const settings = new HotReloader("settings.yaml",
		(newSettings, oldSettings) =>
		{
			for (let plugin of plugins)
			{
				plugin.updateSettings(newSettings);
			}
		},
		(err) =>
		{
			console.error("Error loading settings", err);
		});

	const secrets = new HotReloader("secrets/secrets.yaml",
		(newSecrets, oldSecrets) =>
		{
			//TODO handle hotreload.
			plugin.updateSecrets(newSecrets);
		},
		(err) =>
		{
			console.error("Error loading secrets", err);
		});

	const actions = new ActionQueue(plugins);

	const webServices = createWebServices(settings.data.web || {}, secrets.data.web || {}, plugins);

	plugins.webServices = webServices;

	plugins.setupWebsocketReactivity();

	const profiles = new ProfileManager(actions, plugins);

	await plugins.init(settings, secrets, actions, profiles, webServices);

	let profileFiles = await fs.promises.readdir("./profiles");

	for (let profileFile of profileFiles)
	{
		profiles.loadProfile(path.join("./profiles", profileFile));
	}

	profiles.recombine();

	//Let loose the web server
	webServices.start();
});

app.on("activate", () =>
{
	if (BrowserWindow.getAllWindows().length === 0)
	{
		createWindow();
	}
})