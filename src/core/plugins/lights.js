
const nodeHueApi = require('node-hue-api');

//node-hue-api is dumb and rate limits setGroupState()

//Rate limiting isn't flat for hue bridges, 
// the less individual state parameter changes you send the more total state updates you can send.
// Since node-hue-api doesn't let you disable the rate limiter We create a fake endpoint similar to those in
// https://github.com/peter-murray/node-hue-api/blob/82b24674dbf2bc74cf1776af15344de81d10696a/lib/api/http/endpoints/endpoint.js
// and https://github.com/peter-murray/node-hue-api/blob/82b24674dbf2bc74cf1776af15344de81d10696a/lib/api/http/endpoints/groups.js
// We then execute this endpoint instead.
const fakeSetGroupStateEndpoint = {
	getRequest(parameters)
	{
		let data = {
			method: 'PUT',
			json: true,
		};

		data.url = `/${parameters.username}/groups/${parameters.id}/action`;

		data.data = parameters.state;

		data.headers = {
			'Content-Type': 'application/json'
		}

		return data;
	},
	getErrorHandler()
	{
		return (err) =>
		{
			console.error(err);
		}
	},
	getPostProcessing()
	{
		return null;
	},
	successCode: 200
}


const discovery = nodeHueApi.discovery;
const hueApi = nodeHueApi.v3.api;
const lightstates = nodeHueApi.v3.lightStates;
const { evalTemplate } = require('../utils/template');

const os = require('os');
const { sleep } = require("../utils/sleep.js");
const fs = require("fs");

module.exports = {
	name: "lights",
	uiName: "Lights",
	async init()
	{
		this.groupCache = {};

		if (!await this.discoverBridge())
		{
			return false;
		}

		if (!(await this.loadKey()))
		{
			return false;
		}

		if (!await this.initApi())
		{
			return false;
		}

		return true;
	},
	ipcMethods: {
		async getHubStatus()
		{
			return !!this.hue;
		},
		async searchForHub()
		{
			return await this.forceAuth();
		}
	},
	methods: {
		async forceAuth()
		{
			this.hue = null;

			if (!await this.discoverBridge())
			{
				return false;
			}

			if (!(await this.createUser()))
			{
				console.error("Unable to create new hue user. Abandoning");
				return false;
			}

			if (!(await this.initApi()))
			{
				return false;
			}

			return true;
		},
		async discoverBridge()
		{
			const results = await discovery.nupnpSearch();

			if (results.length == 0)
			{
				console.error("Couldn't find hue bridge");
				return false;
			}
			else
			{
				this.bridgeIp = results[0].ipaddress;
				return true;
			}
		},
		async loadKey()
		{
			try
			{
				this.hueUser = JSON.parse(fs.readFileSync("./user/secrets/hue.json", "utf-8"));
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
					let user = await unauthenticatedApi.users.createUser("CastMate", os.userInfo().username)

					this.hueUser = {
						username: user.username,
						clientKey: user.clientKey
					}

					fs.writeFileSync("./user/secrets/hue.json", JSON.stringify(this.hueUser));

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
		async initApi()
		{
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
		},
		handleTemplateNumber(value, context)
		{
			if (typeof value === 'string' || value instanceof String)
			{
				return evalTemplate(value, context)
			}
			return value;
		},
		async getGroupByName(name)
		{
			if (this.groupCache[name])
			{
				return this.groupCache[name];
			}

			let groups = await this.hue.groups.getGroupByName(name);

			if (groups.length == 0)
				return;

			this.groupCache[name] = groups[0]

			return groups[0];
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
			data: {
				type: Object,
				properties: {
					on: { type: "OptionalBoolean", name: "On" },
					bri: { type: "TemplateNumber", name: "Brightness" },
					hue: { type: "TemplateNumber", name: "Hue" },
					transition: { type: "TemplateNumber", name: "Transition Time" },
					group: { type: String, name: "HUE Light Group" },
				}
			},
			async handler(lightData, context)
			{
				lightData = { ...lightData };

				let groupName = lightData.group || this.settings.defaultGroup;

				let state = new lightstates.GroupLightState();

				if ("on" in lightData)
				{
					lightData.on = this.handleTemplateNumber(lightData.on, context);

					state.on(lightData.on);
				}
				if ("bri" in lightData)
				{
					lightData.bri = this.handleTemplateNumber(lightData.bri, context);

					state.bri(lightData.bri);
				}
				if ("hue" in lightData)
				{
					lightData.hue = this.handleTemplateNumber(lightData.hue, context);

					state.hue(Math.floor((lightData.hue / 360) * 65535))
				}
				if ("transition" in lightData)
				{
					lightData.transition = this.handleTemplateNumber(lightData.transition, context);

					state.transitionInMillis(lightData.transition * 1000)
				}

				let group = await this.hue.groups.getGroupByName(groupName);//await this.getGroupByName(groupName)

				if (group.length == 0)
					return;

				//await this.hue.groups.setGroupState(group.id, state);
				//Run our fake endpoint instead of the library's
				await this.hue.groups.execute(fakeSetGroupStateEndpoint, { id: group[0].id, state: state._state });

			}
		},
		lightScene: {
			name: "Scene",
			description: "Changes HUE lights to a hue scene",
			data: {
				type: Object,
				properties: {
					scene: { type: String, name: "Scene" },
					group: { type: String, name: "HUE Light Group" },
				}
			},
			async handler(sceneData)
			{
				let scene = sceneData.scene;
				let groupName = sceneData.group || this.settings.defaultGroup;

				let sceneId = await this.hue.getSceneByName(scene);

				let state = new lightstates.GroupLightState();
				state.scene(sceneId);

				let groups = await this.hue.groups.getGroupByName(groupName);

				await Promise.all(groups.map((group) => this.hue.groups.setGroupState(group.id, state)));
			}
		}
	},
	settingsView: 'lights.vue'
}