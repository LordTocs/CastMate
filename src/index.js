const { app, BrowserWindow } = require("electron");
const { fstat } = require("fs");
const { ActionQueue } = require("./actions/action-queue.js");
const { ProfileManager } = require("./actions/profile-manager.js");
const { Profile } = require("./actions/profiles.js");
const { Plugin } = require('./plugin.js');
const HotReloader = require('./utils/hot-reloader.js');
const { createWebServices } = require("./utils/webserver.js");
const fs = require('fs');
const path = require('path');



function createWindow()
{
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		}
	});

	win.loadFile("web/index.html");
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(async () =>
{
	createWindow();

	let pluginFiles = await fs.promises.readdir("./src/plugins");

	let plugins = pluginFiles.map((file) => new Plugin(require(`./plugins/${file}`)));

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

	const webServices = createWebServices(settings.data.web || {}, secrets.data.web || {});

	const profiles = new ProfileManager(actions);
	
	let profileFiles = await fs.promises.readdir("./profiles");

	for (let profileFile of profileFiles)
	{
		profiles.loadProfile(path.join("./profiles", profileFile));
	}

	for (let plugin of plugins)
	{
		plugin.init(settings, secrets, actions, profiles, webServices);
	}

	
});

app.on("activate", () =>
{
	if (BrowserWindow.getAllWindows().length === 0)
	{
		createWindow();
	}
})