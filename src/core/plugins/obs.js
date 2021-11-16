const OBSWebSocket = require('obs-websocket-js'); // For more info: https://www.npmjs.com/package/obs-websocket-js
const { template } = require('../utils/template');

module.exports = {
	name: "obs",
	uiName: "OBS",
	async init()
	{
		this.obs = new OBSWebSocket();
		this.connectOBS();
		this.obs.on("SwitchScenes", data =>
		{
			//this.profiles.setCondition("scene", data.sceneName);
			this.state.obsScene = data.sceneName;
		})
		this.obs.on("ConnectionClosed", () =>
		{
			setTimeout(() => { this.connectOBS() }, 5000);
		});
		this.obs.on("StreamStarted", () =>
		{
			this.state.obsStreaming = true;
		})
		this.obs.on("StreamStopped", () =>
		{
			this.state.obsStreaming = false;
		})
		this.obs.on("StreamStatus", (data) =>
		{
			this.state.obsStreaming = data.streaming;
			this.state.obsRecording = data.recording;
		});

		this.obs.on("RecordingStarted", () =>
		{
			this.state.obsRecording = true;
		})
		this.obs.on("RecordingStopped", () =>
		{
			this.state.obsRecording = false;
		})
	},
	methods: {
		async connectOBS()
		{
			let port = this.settings.port || 4444;

			try
			{
				await this.obs.connect({
					address: `localhost:${port}`,
					password: this.secrets.password
				})
				let result = await this.obs.send("GetCurrentScene");
				//this.profiles.setCondition("scene", result.name);
				this.state.obsScene = result.name;
				this.logger.info("OBS connected!");
			} catch {
				return;
			}
		}
	},
	settings: {
		port: { type: Number }
	},
	secrets: {
		password: { type: String }
	},
	state: {
		obsScene: {
			type: String,
			name: "Obs Scene",
			description: "Currently Active OBS Scene"
		},
		obsStreaming: {
			type: Boolean,
			name: "Obs Streaming",
			description: "Is OBS currently Streaming?"
		},
		obsRecording: {
			type: Boolean,
			name: "Obs Recording",
			description: "Is OBS currently Recording?"
		}
	},
	actions: {
		obsScene: {
			name: "OBS Scene",
			description: "Change the OBS scene.",
			color: "#607A7F",
			data: {
				type: String,
				template: true,
			},
			async handler(sceneData, context)
			{
				await this.obs.send('SetCurrentScene', {
					'scene-name': await template(sceneData, context)
				})
			},
		},
		obsFilter: {
			name: "OBS Filter",
			description: "Enable/Disable OBS filter",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					sourceName: {
						type: String,
						template: true,
						name: "Source Name",
					},
					filterName: {
						type: String,
						template: true,
						name: "Filter Name",
					},
					filterEnabled: {
						type: Boolean,
						name: "Filter Enabled"
					}
				}
			},
			async handler(filterData, context)
			{
				const sourceName = await template(filterData.sourceName, context);
				const filterName = await template(filterData.filterName, context);

				await this.obs.send('SetSourceFilterVisibility', {
					sourceName,
					filterName,
					filterEnabled: !!filterData.filterEnabled
				})
			}
		},
		obsText: {
			name: "OBS Text",
			description: "Change the text in a GDI+ text element.",
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
			async handler(textData, context)
			{
				const sourceName = await template(textData.sourceName, context);

				await this.obs.send('SetTextGDIPlusProperties', {
					source: sourceName,
					text: await template(textData.text, context)
				})
			}
		}
	}
}