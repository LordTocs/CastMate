const e = require('express');
const OBSWebSocket = require('obs-websocket-js'); // For more info: https://www.npmjs.com/package/obs-websocket-js
const { template } = require('../utils/template');
const { app } = require("electron");
const ChildProcess = require("child_process")
const regedit = require("regedit");

if (app.isPackaged) {
	console.log("Setting External VBS Location", regedit.setExternalVBSLocation('resources/regedit/vbs'));
}
else {
	console.log("Setting External VBS Location", regedit.setExternalVBSLocation('./node_modules/regedit/vbs'));
}


const OBS_ICON_SVG = "M22,12c0,5.523-4.477,10-10,10S2,17.523,2,12S6.477,2,12,2S22,6.477,22,12z M17.802,9.089 c-0.751-0.421-1.557-0.637-2.366-0.678c-0.335,0.62-0.832,1.139-1.438,1.489c-0.598,0.345-1.29,0.525-2.036,0.494 c-0.293-0.012-0.591-0.043-0.865-0.11C9.503,9.832,8.334,8.372,8.352,6.638c0.018-1.872,1.413-3.468,3.213-3.745 c-0.139,0.001-0.274,0.015-0.418,0.024c-2.615,0.43-4.607,2.779-4.569,5.514c0.011,0.861,0.227,1.667,0.596,2.388 c0.705-0.02,1.402,0.151,2.008,0.501c0.598,0.345,1.1,0.855,1.446,1.516c0.136,0.259,0.253,0.511,0.331,0.773 c0.422,1.615-0.258,3.374-1.779,4.231c-1.63,0.92-3.71,0.51-4.85-0.91c0.07,0.12,0.15,0.23,0.23,0.35c1.68,2.05,4.71,2.6,7.06,1.2 c0.74-0.44,1.33-1.03,1.77-1.71c-0.37-0.6-0.57-1.29-0.57-1.99c0-0.69,0.19-1.38,0.59-2.01c0.157-0.247,0.305-0.464,0.488-0.658 c1.186-1.186,3.06-1.482,4.57-0.59c1.612,0.952,2.297,2.958,1.637,4.655c0.069-0.121,0.124-0.245,0.188-0.374 C21.228,13.323,20.189,10.424,17.802,9.089z"

module.exports = {
	name: "obs",
	uiName: "OBS",
	icon: OBS_ICON_SVG,
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


		this.installDir = this.settings.installDirOverride || await this.lookupInstallDir();
	},
	async onSettingsReload() {
		this.forceStop = true;
		await this.obs.disconnect();
		await this.connectOBS();
	},
	methods: {
		lookupInstallDir() {
			return new Promise((resolve, reject) => {
				regedit.list("HKLM\\SOFTWARE\\OBS Studio", (err, result) => {
					if (err)
						return reject(err);

					try {
						const obsPath = result["HKLM\\SOFTWARE\\OBS Studio"].values[''].value;
						resolve(obsPath);
					}
					catch
					{
						resolve(undefined)
					}
				})
			})
		},
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
		},
		async openOBS() {
			
			return await new Promise((resolve, reject) => {
				const startCmd = `Start-Process "${this.installDir}\\bin\\64bit\\obs64.exe" -Verb runAs`
				this.logger.info(`Opening OBS ${startCmd}`);

				if (!this.installDir)
					return resolve(false);
				
				try {
					ChildProcess.exec(startCmd, { shell: "powershell.exe", cwd: `${this.installDir}\\bin\\64bit\\` }, (err, stdout, stderr) => {
						console.log(stdout);
						console.error(stderr);
						if (err) {
							console.error(err);
							return resolve(false);
						}
						resolve(true);
					});
				}
				catch (err) {
					console.error("Error Spawning:", err);
					return reject(err);
				}

			})

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