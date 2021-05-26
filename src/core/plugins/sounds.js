const { ipcMain, BrowserWindow } = require("electron");
const path = require("path");

module.exports = {
	name: "sounds",
	uiName: "Sounds",
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
			return path.resolve(path.join("./user", filename));
		}
	},
	settings: {
	},
	secrets: {
	},
	actions: {
		sound: {
			name: "Sound",
			data: {
				type: String,
			},
			color: "#62894F",
			async handler(soundData)
			{
				if (this.audioWindowSender)
				{
					this.audioWindowSender.send('play-sound', {
						source: this.getFullFilepath(soundData)
					});
				}
				else
				{
					console.log("Sound Window Not Available")
				}
			}
		}
	}
}