const { description } = require('node-hue-api/dist/esm/api/discovery');
const OBSWebSocket = require('obs-websocket-js');
 

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
            this.profiles.setCondition("scene", data.sceneName);
        })
        let result = await this.obs.send("GetCurrentScene");
        this.profiles.setCondition("scene", result.name);
	},
	methods: {
	},
	settings: {
        port: { type: Number }
	},
	secrets: {
        password: {type: String}
	},
    profileTriggers: {
		scene: {
			name: "OBS Scene",
			description: "Change profile based on current OBS scene."
		}
	},
	actions: {
        scene: {
            name: "OBS Scene",
            description: "Change the OBS scene.",
            async handler(sceneData)
			{
                await this.obs.send('SetCurrentScene', {
                    'scene-name': sceneData
                })
			}
        }
	}
}