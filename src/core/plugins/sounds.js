const { ipcMain, BrowserWindow } = require("electron");
const path = require("path");

module.exports = {
	name: "sounds",
	async init()
	{
		this.audioWindow = new BrowserWindow({
			width: 100,
			height: 100,
			show: false,
			webPreferences: {
				nodeIntegration: true
			}
		});

		this.audioWindow.loadFile(path.join(__static, "sounds.html"));

		ipcMain.on('sound-window', (event) =>
		{
			this.audioWindowSender = event.sender;
		})
	},
	methods: {
		getFullFilepath(filename)
		{
			return path.resolve(path.join("./user",filename));
		}
	},
	settings: {
	},
	secrets: {
	},
	actions: {
		sound: {
			data: {
				type: String
			},
			async handler(soundData)
			{
				if (this.audioWindowSender)
				{
					this.audioWindowSender.send('play-sound', {
						source: this.getFullFilepath(soundData)
					});
				}
			}
		}
	}
}