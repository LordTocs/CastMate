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
			console.log("Failed to connect to OBS...retrying.")
			setTimeout(() => { this.connectOBS() }, 5000);
		});
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
				console.log("OBS connected!");
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
		}
	},
	actions: {
		obsScene: {
			name: "OBS Scene",
			description: "Change the OBS scene.",
			color: "#607A7F",
			data: {
				type: "TemplateString"
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
						type: "TemplateString",
						name: "Source Name",
					},
					filterName: {
						type: "TemplateString",
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
				console.log("Filter: ", sourceName, filterName);

				await this.obs.send('SetSourceFilterVisibility', {
					sourceName,
					filterName,
					filterEnabled: !!filterData.filterEnabled
				})	
			}
		}
	}
}