const { app, BrowserWindow } = require("electron");
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
			//TODO handle hotreload.
		},
		(err) =>
		{
			console.error("Error loading settings", err);
		});

	const secrets = new HotReloader("secrets/secrets.yaml",
		(newSettings, oldSettings) =>
		{
			//TODO handle hotreload.
		},
		(err) =>
		{
			console.error("Error loading secrets", err);
		});

	const webServices = createWebServices(settings.data.web || {});

	for (let plugin of plugins)
	{
		plugin.init(settings, secrets, webServices);
	}
});

app.on("activate", () =>
{
	if (BrowserWindow.getAllWindows().length === 0)
	{
		createWindow();
	}
})