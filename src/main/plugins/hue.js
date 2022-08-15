class HUEStateTracker {
	constructor() {
		this.lastState = {};
	}

	getGroupColorState(group, requestedState) {
		const deltaState = {};
		if (!this.lastState[group]) {
			this.lastState[group] = {};
		}
		const lastState = this.lastState[group];


		if (requestedState.bri != undefined) {
			if (lastState.bri != requestedState.bri) {
				deltaState.bri = requestedState.bri;
				lastState.bri = requestedState.bri;
			}
		}
		if (requestedState.sat != undefined) {
			if (lastState.sat != requestedState.sat) {
				deltaState.sat = requestedState.sat;
				lastState.sat = requestedState.sat;
			}
		}
		if (requestedState.hue != undefined) {
			if (lastState.hue != requestedState.hue) {
				deltaState.hue = requestedState.hue;
				lastState.hue = requestedState.hue;
				delete lastState.ct;
			}
		}
		if (requestedState.ct != undefined) {
			if (lastState.temp != requestedState.ct) {
				deltaState.ct = requestedState.ct;
				lastState.ct = requestedState.ct;
				delete lastState.hue;
				delete lastState.sat;
			}
		}
		if (requestedState.on != undefined) {
			if (lastState.on != requestedState.on) {
				deltaState.on = requestedState.on;
				lastState.on = requestedState.on;
				if (!requestedState.on) {
					this.lastState[group] = {};
				}
			}
		}
		if (requestedState.transition != undefined) {
			deltaState.transition = requestedState.transition;
		}
		return deltaState;
	}

	clearGroupState(group) {
		this.lastState[group] = {};
	}
}


import { evalTemplate } from '../utils/template.js'

import * as chromatism from 'chromatism2';
import fs from "fs"
import path from 'path'
import { userFolder } from '../utils/configuration.js'
import axios from "axios"
import _ from "lodash"
import https from 'https';
import { AsyncCache } from '../utils/async-cache.js';
import os from 'os';
import { sleep } from '../utils/sleep.js';

class HUEApi
{
	static async create(ip, key)
	{
		const result = new HUEApi();

		// The cert provided in the HUE docs does not appear to work. So for now, ignore https.
		const httpsAgent = new https.Agent ({
			rejectUnauthorized: false,
		})

		result.api = axios.create({
			baseURL: `https://${ip}/clip/v2`,
			headers: {
				'hue-application-key': key
			},
			httpsAgent
		});

		result.groupCache = new AsyncCache(async () => {
			try {
				const resp = await result.api.get(`/resource/room`);
				const groups = resp.data.data;
				return groups;
			}
			catch(err) {
				return [];
			}
		})

		await result.getGroups();

		return result;
	}

	static async createKey(ip) {
		try {
			const resp = await axios.post(`http://${ip}/api`, {
				devicetype: `CastMate#${os.userInfo().username}`,
			});

			console.log(resp.data);

			if (resp.data?.[0]?.success?.username)
			{
				return resp.data[0].success.username;
			}
		}
		catch(err) {
			console.log(err);
			return undefined;
		}
	}

	async getGroups()
	{
		return await this.groupCache.get();
	}

	async getGroupByName(name)
	{
		const cachedGroups = await this.groupCache.get();
		const group = cachedGroups.find((g) => g.metadata.name == name);
		return group;
	}

	async setGroupState(id, state)
	{
		const update = {};

		if ("on" in state)
		{
			update.on = { on: !!state.on }
		} 
		if ("bri" in state)
		{
			update.dimming = {
				brightness: Math.max(Math.min(Number(state.bri),100), 0)
			}
		}
		if ("hue" in state || "sat" in state)
		{
			const hue = Math.max(Math.min(Number("hue" in state ? Number(state.hue) : 0), 360), 0);
			const sat = Math.max(Math.min(Number("sat" in state ? Number(state.sat) : 100), 100), 0);
			const bri = Math.max(Math.min(Number("bri" in state ? Number(state.bri) : 100), 100), 0);
			console.log("Hue", hue, "Sat", sat, "Bri", bri);
			const cie = chromatism.convert({ h: hue, s: sat, v: bri }).xyY
			update.color = {
				xy: {
					x: cie.x,
					y: cie.y
				}
			}
		}

		if ("transition" in state)
		{
			update.dynamics = {
				duration: Math.round(state.transition)
			}
		}

		console.log("Setting Grouped Light", id, update);

		try {
			await this.api.put(`/resource/grouped_light/${id}`, update);
		}
		catch(err) {
			console.error(`HUE API ERROR: `);
			//this.logger.error(err);
			//console.log(err?.response);
			for (let errorStr of err?.response?.data?.errors) {
				console.error(errorStr);
			}
			//throw err;
		}
	}
}

export default {
	name: "hue",
	uiName: "HUE Lights",
	icon: "mdi-lightbulb-on-outline",
	color: "#7F743F",
	async init() {
		this.stateTracker = new HUEStateTracker();

		this.stateResetter = setInterval(() => {
			this.stateTracker.lastState = {};
		}, 60000);

		this.bridgeCache = this.getCache("bridgeCache");


		if (!await this.checkForBridge()) {
		 	if (!await this.discoverBridge()) {
				return false;
			}
		}

		if (!(await this.loadKey())) {
			return false;
		}

		if (!await this.initApi()) {
			return false;
		}

		return true;
	},
	ipcMethods: {
		async getHubStatus() {
			return !!this.hue;
		},
		async searchForHub() {
			return await this.forceAuth();
		}
	},
	methods: {
		async forceAuth() {
			this.hue = null;

			if (!await this.discoverBridge()) {
				return false;
			}

			if (!(await this.createUser())) {
				console.error("Unable to create new hue user. Abandoning");
				return false;
			}

			if (!(await this.initApi())) {
				return false;
			}

			return true;
		},
		async checkForBridge() {
			const cached = await this.bridgeCache.get();
			this.logger.info("Checking Cached Bridge")
			if (!cached?.bridgeIp)
			{
				this.logger.info("No Cached Bridge");
				return false;
			}

			this.bridgeIp = cached.bridgeIp;
			return true;
		},
		async discoverBridge() {
			this.logger.info("Running HUE Discovery API");
			const resp = await axios.get("https://discovery.meethue.com/");
			const results = resp.data;

			if (results.length == 0) {
				this.logger.error("Couldn't find hue bridge");
				return false;
			}
			else {
				this.bridgeIp = results[0].internalipaddress;
				this.bridgeCache.set({ bridgeIp: this.bridgeIp });
				return true;
			}
		},
		async loadKey() {
			try {
				this.hueUser = JSON.parse(fs.readFileSync(path.join(userFolder, "secrets/hue.json"), "utf-8"));
				return true;
			}
			catch (err) {
				return false;
			}
		},
		async createUser() {
			//Try to create user 5 times to allow for hue bridge button to be pressed.
			const retries = 6;
			for (let i = 0; i < retries; ++i) {
				let key = await HUEApi.createKey(this.bridgeIp);
				
				if (key)
				{
					this.hueUser = {
						username: key,
					}

					fs.writeFileSync(path.join(userFolder, "secrets/hue.json"), JSON.stringify(this.hueUser));

					return true;
				}

				this.logger.error("The link button on the bridge was not pressed. Press and try again.");

				if (i != retries - 1) {
					this.logger.info("Trying again in 5 seconds...");
					await sleep(5000);
				}
			}

			return false;
		},
		async initApi() {
			try {
				this.hue = await HUEApi.create(this.bridgeIp, this.hueUser.username);
				this.analytics.set({ usesHue: true });
				return true;
			}
			catch (err) {
				console.error("Unable to connect with user to bridge. Abandoning");
				console.error(err);

				return false;
			}
		},
		async handleTemplateNumber(value, context) {
			if (typeof value === 'string' || value instanceof String) {
				return await evalTemplate(value, context)
			}
			return value;
		},
		async getGroupNames() {
			try {
				return (await this.hue.getGroups()).map(g => g.metadata.name)
			}
			catch (err) {
				for (let errorStr of err?.response?.data?.errors) {
					console.error(errorStr);
				}
				return []
			}
		},
		async getSceneNames() {
			try {
				return (await this.hue.scenes.getAll()).map(s => s.name)
			}
			catch (err) {
				this.logger.error(err);
				console.error(err);
				return []
			}
		},
	},
	settings: {
		defaultGroup: {
			type: String,
			name: "Default HUE Group",
			async enum() {
				return await this.getGroupNames()
			}
		}
	},
	secrets: {
	},
	actions: {
		color: {
			name: "Hue Light",
			description: "Changes HUE lights.",
			icon: "mdi-lightbulb-on-outline",
			color: "#7F743F",
			data: {
				type: Object,
				properties: {
					on: { 
						type: Boolean, 
						name: "Light Switch", 
						required: true, 
						default: true, 
						trueIcon: "mdi-lightbulb-on",
						falseIcon: "mdi-lightbulb-outline"
					},
					hsbk: {
						type: "LightColor",
						name: "Color",
						tempRange: [2000, 6500],
						required: true 
					},
					transition: {
						type: Number,
						template: true,
						name: "Transition Time",
						required: true,
						default: 0.5 
					},
					group: {
						type: String,
						template: true,
						name: "HUE Light Group",
						async enum() {
							return await this.getGroupNames()
						}
					},
				}
			},
			async handler(lightData, context) {
				lightData = _.cloneDeep(lightData);

				let groupName = lightData.group || this.settings.defaultGroup;

				const requestedState = {};

				if ("on" in lightData) {
					lightData.on = await this.handleTemplateNumber(lightData.on, context);

					requestedState.on = !!lightData.on;
				}


				if ("hsbk" in lightData) {
					const mode = lightData.hsbk.mode || 'color';

					if ("bri" in lightData.hsbk && (mode == 'color' || mode == "template")) {
						lightData.hsbk.bri = await this.handleTemplateNumber(lightData.hsbk.bri, context);

						requestedState.bri = lightData.hsbk.bri;
					}
					if ("sat" in lightData.hsbk && (mode == 'color' || mode == "template")) {
						lightData.hsbk.sat = await this.handleTemplateNumber(lightData.hsbk.sat, context);

						requestedState.sat = lightData.hsbk.sat;
					}
					if ("hue" in lightData.hsbk && (mode == 'color' || mode == "template")) {
						lightData.hsbk.hue = await this.handleTemplateNumber(lightData.hsbk.hue, context);

						//Hue is 0-360
						requestedState.hue = lightData.hsbk.hue;
					}
					if ("temp" in lightData.hsbk && (mode == 'temp' || mode == "template")) {
						lightData.hsbk.temp = await this.handleTemplateNumber(lightData.hsbk.temp, context);

						//Convert kelvin to mired. https://en.wikipedia.org/wiki/Mired
						requestedState.ct = (1000000 / lightData.hsbk.temp);
					}
				}

				this.logger.info(`Hue Lights: ${JSON.stringify(lightData)}`)

				if ("transition" in lightData) {
					lightData.transition = await this.handleTemplateNumber(lightData.transition, context);

					requestedState.transition = (lightData.transition * 1000);
				}

				//let state = this.stateTracker.getGroupColorState(groupName, requestedState);

				let group = await this.hue.getGroupByName(groupName);

				if (!group)
					return;

				console.log("Group", group);
				const service = group.services.find(s => s.rtype == 'grouped_light');
				await this.hue.setGroupState(service.rid, requestedState);

			}
		},
		/*scene: {
			name: "Hue Scene",
			description: "Changes HUE lights to a hue scene",
			icon: "mdi-lightbulb-on-outline",
			color: "#7F743F",
			data: {
				type: Object,
				properties: {
					scene: {
						type: String,
						name: "Scene",
						async enum() {
							return await this.getSceneNames();
						}
					},
					group: {
						type: String,
						template: true,
						name: "HUE Light Group",
						async enum() {
							return await this.getGroupNames()
						}
					},
				}
			},
			async handler(sceneData) {
				let scene = sceneData.scene;
				let groupName = sceneData.group || this.settings.defaultGroup;

				this.stateTracker.clearGroupState(groupName);

				let sceneObj = await this.hue.scenes.getSceneByName(scene);

				let state = new lightstates.GroupLightState();
				state.scene(sceneObj[0].id);

				let groups = await this.hue.getGroupByName(groupName);

				await Promise.all(groups.map((group) => this.hue.groups.setGroupState(group.id, state)));
			}
		}*/
	},
	settingsView: 'hue.vue'
}