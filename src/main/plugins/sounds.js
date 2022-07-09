import { ipcMain, BrowserWindow, app } from "../utils/electronBridge.js"
import { template } from '../utils/template.js'
import path from "path"
import { userFolder } from "../utils/configuration.js"
import say from "say"
import { nanoid } from "nanoid/non-secure"
//const nanoid = await import("nanoid/non-secure");

export default {
	name: "sounds",
	uiName: "Sounds",
	icon: "mdi-volume-high",
	color: "#62894F",
	async init() {
		this.idgen = nanoid.customAlphabet('1234567890abcdef', 10)

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
		},
		playAudioFile(filename, volume) {
			if (!this.audioWindowSender) {
				this.logger.error("Audio Window Not Available");
				return;
			}
			const globalVolume = this.settings.globalVolume != undefined ? (this.settings.globalVolume / 100) : 1.0;

			this.audioWindowSender.send('play-sound', {
				source: filename,
				volume: (volume != undefined ? (volume / 100) : 1.0) * globalVolume
			});
		}
	},
	settings: {
		globalVolume: {
			type: Number,
			name: "Global Volume",
			description: "Global Volume control.",
			slider: [0.0, 1.0],
			default: 1.0,
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
				this.playAudioFile(this.getFullFilepath(soundData.sound), soundData.volume);
			},
		},
		tts: {
			name: "Text to Speech",
			icon: "mdi-account-voice",
			color: "#62894F",
			data: {
				type: Object,
				properties: {
					message: {
						type: String,
						template: true,
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
			async handler(data, context) {
				const message = await template(data.message, context);
				this.logger.info(`Speaking: ${message}`);
				const soundPath = path.join(app.getPath("temp"), this.idgen() + ".wav");
				say.export(message, undefined, undefined, soundPath, (err) => {
					if (err) {
						this.logger.error(String(err));
						return;
					}

					//this.logger.info(`Exporting to ${soundPath}`);

					this.playAudioFile(soundPath, data.volume);
				});
			}
		}
	}
}
