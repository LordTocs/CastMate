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
			if (!this.forceStop) {
				setTimeout(() => { this.connectOBS() }, 5000);
			}
			else {
				this.forceStop = false;
			}
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
	async onSettingsReload() {
		this.forceStop = true;
		await this.obs.disconnect();
		await this.connectOBS();
	},
	methods: {
		async connectOBS() {
			const port = this.settings.port || 4444;
			const hostname = this.settings.hostname || "localhost"

			try {
				await this.obs.connect({
					address: `${hostname}:${port}`,
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
		async getSceneSources(sceneName) {
			try {
				const result = await this.obs.send("GetSceneItemList", { sceneName });
				return result.sceneItems.map(s => s.sourceName);
			}
			catch
			{
				return [];
			}
		},
		async getAllScenes() {
			try {
				const result = await this.obs.send('GetSceneList');
				const sceneitems = result.scenes.map((s) => s.name);
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
		hostname: { type: String, name: "Host Name" },
		port: { type: Number, name: "Port" }
	},
	secrets: {
		password: { type: String, name: "Websocket Password" }
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
		source: {
			name: "Source Visibility",
			description: "Change a OBS source's visibilty",
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
					},
					source: {
						type: String,
						template: true,
						async enum(context) {
							this.logger.info('Fetching sources for ' + context.scene);
							return await this.getSceneSources(context.scene);
						}
					},
					enabled: {
						type: Boolean,
						name: "Source Visible"
					}
				}
			},
			async handler(data, context) {
				await this.obs.send('SetSceneItemRender', {
					'scene-name': await template(data.scene, context),
					'source': await template(data.source, context),
					'render': data.enabled,
				})
			},
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