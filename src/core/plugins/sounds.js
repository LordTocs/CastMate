const { ipcMain, BrowserWindow } = require("electron");
const path = require("path");
const { userFolder } = require("../utils/configuration");

module.exports = {
	name: "sounds",
	uiName: "Sounds",
	icon: "mdi-volume-high",
	color: "#62894F",
	async init() {
		this.audioWindow = new BrowserWindow({
			width: 100,
			height: 100,
			show: false,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				enableRemoteModule: true,
			}
		});

		this.audioWindow.loadFile(path.join(__static, "sounds.html"));

		ipcMain.on('sound-window', (event) => {
			this.audioWindowSender = event.sender;
		})
	},
	methods: {
		getFullFilepath(filename) {
			return path.resolve(path.join(userFolder, 'sounds', filename));
		}
	},
	settings: {
		globalVolume: {
			type: Number,
			name: "Global Volume",
			description: "Global Volume control.",
			slider: [0.0, 1.0]
		}
	},
	secrets: {
	},
	actions: {
		sound: {
			name: "Sound",
			data: {
				type: Object,
				properties: {
					sound: {
						type: "FilePath",
						recursive: true,
						path: './sounds/',
						name: "Sound File",
					},
					volume: {
						type: Number,
						template: true,
						name: "Volume",
						default: 100,
						slider: {
							min: 0,
							max: 100,
							step: 1,
						}
					}
				}
			},
			icon: "mdi-volume-high",
			color: "#62894F",
			async handler(soundData) {
				if (this.audioWindowSender) {
					const globalVolume = this.settings.globalVolume != undefined ? (this.settings.globalVolume / 100) : 1.0;
					this.audioWindowSender.send('play-sound', {
						source: this.getFullFilepath(soundData.sound),
						volume: ("volume" in soundData ? (soundData.volume / 100) : 1.0) * globalVolume
					});
				}
				else {
					this.logger.error("Audio Window Not Available");
				}
			}
		}
	}
}