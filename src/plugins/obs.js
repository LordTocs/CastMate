const OBSWebSocket = require('obs-websocket-js'); // For more info: https://www.npmjs.com/package/obs-websocket-js
const  { template } = require ('../utils/template');

module.exports = {
	name: "obs",
	async init()
	{
        this.obs = new OBSWebSocket();
        this.connectOBS();
        this.obs.on("SwitchScenes", data => {
            //this.profiles.setCondition("scene", data.sceneName);
            this.state.obsScene = data.sceneName;
        })
        this.obs.on("ConnectionClosed", () => {
            console.log("Failed to connect to OBS...retrying.")
            setTimeout(() => {this.connectOBS()}, 5000);
        });
	},
	methods: {
        async connectOBS() {
            try {
                await this.obs.connect({
                    address: `localhost:${this.settings.port}`,
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