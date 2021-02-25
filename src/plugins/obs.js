const OBSWebSocket = require('obs-websocket-js');
const  { template } = require ('../utils/template');

module.exports = {
	name: "obs",
	async init()
	{
        this.obs = new OBSWebSocket();

        await this.obs.connect({
            address: `localhost:${this.settings.port}`,
            password: this.secrets.password
        })

        this.obs.on("SwitchScenes", data => {
            //this.profiles.setCondition("scene", data.sceneName);
			this.state.obsScene = data.sceneName;
        })
        let result = await this.obs.send("GetCurrentScene");
        //this.profiles.setCondition("scene", result.name);
		this.state.obsScene = result.name;
	},
	methods: {
	},
	settings: {
        port: { type: Number }
	},
	secrets: {
        password: {type: String}
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
            async handler(sceneData, context)
			{
                await this.obs.send('SetCurrentScene', {
                    'scene-name': template(sceneData, context)
                })
			},
        }
	}
}