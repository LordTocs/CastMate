const { app, BrowserWindow } = require("electron");
const { ActionQueue } = require("./actions/action-queue.js");
const { ProfileManager } = require("./actions/profile-manager.js");
const { Profile } = require("./actions/profiles.js");
const { Plugin } = require('./plugin.js');
const HotReloader = require('./utils/hot-reloader.js');
const { createWebServices } = require("./utils/webserver.js");





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

app.whenReady().then(async () =>
{
	createWindow();

	const twitchPlugin = new Plugin(require("./plugins/twitch"));

	let plugins = [twitchPlugin];

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
	profiles.loadProfile("./profiles/root.yaml");

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