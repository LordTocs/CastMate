const e = require('express');
const OBSWebSocket = require('obs-websocket-js'); // For more info: https://www.npmjs.com/package/obs-websocket-js
const { template } = require('../utils/template');

module.exports = {
	name: "obs",
	uiName: "OBS",
	icon: "mdi-broadcast",
	color: "#607A7F",
	async init() {
		this.obs = new OBSWebSocket();
		this.state.recording = false;
		this.state.streaming = false;
		this.connectOBS();
		this.obs.on("SwitchScenes", data => {
			this.state.scene = data.sceneName;
		})
		this.obs.on("ConnectionClosed", () => {
			this.state.connected = false;
			setTimeout(() => { this.connectOBS() }, 5000);
		});
		this.obs.on("StreamStarted", () => {
			this.state.streaming = true;
		})
		this.obs.on("StreamStopped", () => {
			this.state.streaming = false;
		})
		this.obs.on("StreamStatus", (data) => {
			this.state.streaming = data.streaming;
			this.state.recording = data.recording;
		});

		this.obs.on("RecordingStarted", () => {
			this.state.recording = true;
		})
		this.obs.on("RecordingStopped", () => {
			this.state.recording = false;
		})
	},
	methods: {
		async connectOBS() {
			let port = this.settings.port || 4444;

			try {
				await this.obs.connect({
					address: `localhost:${port}`,
					password: this.secrets.password
				})
				let result = await this.obs.send("GetCurrentScene");
				this.state.scene = result.name;
				this.logger.info("OBS connected!");
				this.state.connected = true;
			} catch {
				this.state.connected = false;
				return;
			}
		},
		async getAllSources() {
			try {
				const result = await this.obs.send("GetSourcesList");
				return result.sources;
			}
			catch
			{
				return [];
			}
		},
		async getSourceFilters(sourceName) {
			try {
				const result = await this.obs.send("GetSourceFilters", { sourceName });
				return result.filters.map(s => s.name);
			}
			catch
			{
				return [];
			}
		},
		async getAllScenes() {
			try {
				console.log("Getting Scenes");
				const result = await this.obs.send('GetSceneList');
				const sceneitems = result.scenes.map((s) => s.name);
				console.log(sceneitems);
				return sceneitems;
			}
			catch (err) {
				console.error(err);
				return [];
			}
		}
	},
	ipcMethods: {
		async refereshAllBrowsers() {
			const sources = await this.getAllSources();

			const browsers = sources.filter((s) => s.typeId == "browser_source");

			await Promise.all(browsers.map(browser => this.obs.send('RefreshBrowserSource', { sourceName: browser.name })));
		}
	},
	settings: {
		port: { type: Number }
	},
	secrets: {
		password: { type: String }
	},
	state: {
		scene: {
			type: String,
			name: "Obs Scene",
			description: "Currently Active OBS Scene",
			async enum() {
				return await this.getAllScenes();
			}
		},
		streaming: {
			type: Boolean,
			name: "Obs Streaming",
			description: "Is OBS currently Streaming?"
		},
		recording: {
			type: Boolean,
			name: "Obs Recording",
			description: "Is OBS currently Recording?"
		},
		connected: {
			type: Boolean,
			name: "Obs Connected",
			description: "Is castmate connected to OBS."
		}
	},
	actions: {
		scene: {
			name: "OBS Scene",
			description: "Change the OBS scene.",
			icon: "mdi-swap-horizontal-bold",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					scene: {
						type: String,
						template: true,
						async enum() {
							return await this.getAllScenes();
						}
					}
				}
			},
			async handler(sceneData, context) {
				await this.obs.send('SetCurrentScene', {
					'scene-name': await template(sceneData.scene, context)
				})
			},
		},
		filter: {
			name: "OBS Filter",
			description: "Enable/Disable OBS filter",
			icon: "mdi-eye",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					sourceName: {
						type: String,
						template: true,
						name: "Source Name",
						async enum() {
							return (await this.getAllSources()).map(s => s.name);
						}
					},
					filterName: {
						type: String,
						template: true,
						name: "Filter Name",
						async enum(context) {
							console.log(context)
							this.logger.info('Fetching filters for ' + context.sourceName);
							return await this.getSourceFilters(context.sourceName);
						}
					},
					filterEnabled: {
						type: Boolean,
						name: "Filter Enabled"
					}
				}
			},
			async handler(filterData, context) {
				const sourceName = await template(filterData.sourceName, context);
				const filterName = await template(filterData.filterName, context);

				await this.obs.send('SetSourceFilterVisibility', {
					sourceName,
					filterName,
					filterEnabled: !!filterData.filterEnabled
				})
			}
		},
		text: {
			name: "OBS Text",
			description: "Change the text in a GDI+ text element.",
			icon: "mdi-form-textbox",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					text: {
						type: String,
						template: true,
						name: "Text"
					},
					sourceName: {
						type: String,
						template: true,
						name: "Source Name",
					},
				}
			},
			async handler(textData, context) {
				const sourceName = await template(textData.sourceName, context);

				await this.obs.send('SetTextGDIPlusProperties', {
					source: sourceName,
					text: await template(textData.text, context)
				})
			}
		}
	}
}