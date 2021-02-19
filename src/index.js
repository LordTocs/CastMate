const { app, BrowserWindow } = require("electron");
const { Plugin } = require('./plugin.js');
const HotReloader = require('./utils/hot-reloader.js');



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

		});

	const secrets = new HotReloader("secrets.yaml",
		(newSettings, oldSettings) =>
		{
			//TODO handle hotreload.
		},
		(err) =>
		{

		});

	for (let plugin of plugins)
	{
		plugin.init(settings, secrets);
	}
});

app.on("activate", () =>
{
	if (BrowserWindow.getAllWindows().length === 0)
	{
		createWindow();
	}
})