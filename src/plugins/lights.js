
const nodeHueApi = require('node-hue-api');
const discovery = nodeHueApi.discovery;
const hueApi = nodeHueApi.v3.api;
const lightstates = nodeHueApi.v3.lightStates;

const os = require('os');
const { sleep } = require("../utils/sleep.js");

const fs = require("fs");

module.exports = {
	name: "lights",
	async init()
	{
		if (!await this.auth())
			return;

		let groups = await this.hue.groups.getAll();

		for (let group of groups)
		{
			console.log(group.toStringDetailed());
		}
	},
	methods: {
		async discoverBridge()
		{
			const results = await discovery.nupnpSearch();

			if (results.length == 0)
			{
				console.error("Couldn't find hue bridge");
				return null;
			}
			else
			{
				return results[0].ipaddress;
			}
		},
		async loadKey()
		{
			try
			{
				this.hueUser = JSON.parse(fs.readFileSync("./secrets/hue.json", "utf-8"));
				return true;
			}
			catch (err)
			{
				return false;
			}
		},
		async createUser()
		{
			//Connect to hue bridge (unauthenticated)
			let unauthenticatedApi = null;
			try
			{
				unauthenticatedApi = await hueApi.createLocal(this.bridgeIp).connect();
			}
			catch (err)
			{
				console.error("Unable to connect to bridge to create user");
				return false;
			}

			//Try to create user 5 times to allow for hue bridge button to be pressed.
			const retries = 5;
			for (let i = 0; i < retries; ++i)
			{
				try
				{
					let user = await unauthenticatedApi.users.createUser("StreamMachine", os.userInfo().username)

					this.hueUser = {
						username: user.username,
						clientKey: user.clientKey
					}

					fs.writeFileSync("./secrets/hue.json", JSON.stringify(this.hueUser));

					return true;
				}
				catch (err)
				{
					console.error("The link button on the bridge was not pressed. Press and try again.");
				}

				if (i != retries - 1)
				{
					console.log("Trying again in 5 seconds...");
					await sleep(5000);
				}
			}

			return false;
		},
		async auth()
		{
			this.bridgeIp = await this.discoverBridge();

			if (!this.bridgeIp)
			{
				console.error("Unable to find hue bridge");
				return false;
			}

			if (!(await this.loadKey()))
			{
				console.log("Couldn't find hue user, creating a new one.")

				if (!(await this.createUser()))
				{
					console.error("Unable to create new hue user. Abandoning");
					return false;
				}
			}

			try
			{
				this.hue = await hueApi.createLocal(this.bridgeIp).connect(this.hueUser.username);
				return true;
			}
			catch (err)
			{
				console.error("Unable to connect with user to bridge. Abandoning");
				return false;
			}
		}
	},
	settings: {
		defaultGroup: { type: String }
	},
	secrets: {
	},
	actions: {
		light: {
			name: "Light",
			description: "Changes HUE lights.",
			async handler(lightData)
			{
				let groupName = lightData.group || this.settings.defaultGroup;

				let state = new lightstates.GroupLightState();

				if ("on" in lightData)
				{
					state.on(lightData.on);
				}
				if ("bri" in lightData)
				{
					state.bri(lightData.bri);
				}
				if ("hue" in lightData)
				{
					state.hue(Math.floor((lightData.hue / 360) * 65535))
				}
				if ("transition" in lightData)
				{
					state.transitionInMillis(lightData.transition / 1000)
				}

				let groups = await this.hue.groups.getGroupByName(groupName);

				let lightUpdates = await Promise.all(groups.map((group) => this.hue.groups.setGroupState(group.id, state)));

				console.log(lightUpdates);
			}
		},
		scene: {
			name: "Scene",
			description: "Changes HUE lights to a hue scene",
			async handler(sceneData)
			{
				let scene = (sceneData instanceof String) ? sceneData : sceneData.scene;
				let groupName = lightData.group || this.settings.defaultGroup;

				let sceneId = await this.hue.getSceneByName(scene);

				let state = new lightstates.GroupLightState();
				state.scene(sceneId);

				let groups = await this.hue.groups.getGroupByName(groupName);

				let lightUpdates = await Promise.all(groups.map((group) => this.hue.groups.setGroupState(group.id, state)));
			}
		}
	}
}