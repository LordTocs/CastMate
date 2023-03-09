import { evalTemplate } from "../state/template.js"
import * as chromatism from "chromatism2"
import fs from "fs"
import path from "path"
import { userFolder } from "../utils/configuration.js"
import axios from "axios"
import _, { clamp } from "lodash"
import https from "https"
import { AsyncCache } from "../utils/async-cache.js"
import os from "os"
import { sleep } from "../utils/sleep.js"
import { Plug, Light } from "../iot/iot-manager.js"

class HUEStateTracker {
	constructor() {
		this.lastState = {}
	}

	getGroupColorState(group, requestedState) {
		const deltaState = {}
		if (!this.lastState[group]) {
			this.lastState[group] = {}
		}
		const lastState = this.lastState[group]

		if (requestedState.bri != undefined) {
			if (lastState.bri != requestedState.bri) {
				deltaState.bri = requestedState.bri
				lastState.bri = requestedState.bri
			}
		}
		if (requestedState.sat != undefined) {
			if (lastState.sat != requestedState.sat) {
				deltaState.sat = requestedState.sat
				lastState.sat = requestedState.sat
			}
		}
		if (requestedState.hue != undefined) {
			if (lastState.hue != requestedState.hue) {
				deltaState.hue = requestedState.hue
				lastState.hue = requestedState.hue
				delete lastState.ct
			}
		}
		if (requestedState.ct != undefined) {
			if (lastState.temp != requestedState.ct) {
				deltaState.ct = requestedState.ct
				lastState.ct = requestedState.ct
				delete lastState.hue
				delete lastState.sat
			}
		}
		if (requestedState.on != undefined) {
			if (lastState.on != requestedState.on) {
				deltaState.on = requestedState.on
				lastState.on = requestedState.on
				if (!requestedState.on) {
					this.lastState[group] = {}
				}
			}
		}
		if (requestedState.transition != undefined) {
			deltaState.transition = requestedState.transition
		}
		return deltaState
	}

	clearGroupState(group) {
		this.lastState[group] = {}
	}
}

class HUEApi {
	static async create(ip, key) {
		const result = new HUEApi()

		// The cert provided in the HUE docs does not appear to work. So for now, ignore https.
		const httpsAgent = new https.Agent({
			rejectUnauthorized: false,
		})

		result.api = axios.create({
			baseURL: `https://${ip}/clip/v2`,
			headers: {
				"hue-application-key": key,
			},
			httpsAgent,
		})

		result.groupCache = new AsyncCache(async () => {
			try {
				const resp = await result.api.get(`/resource/room`)
				const groups = resp.data.data
				return groups
			} catch (err) {
				return []
			}
		})

		result.sceneCache = new AsyncCache(async () => {
			try {
				const resp = await result.api.get(`/resource/scene`)
				const scenes = resp.data.data
				return scenes
			} catch (err) {
				return []
			}
		})

		result.lightCache = new AsyncCache(async () => {
			try {
				const resp = await result.api.get(`/resource/light`)
				return resp.data.data
			} catch (err) {
				return []
			}
		})

		await result.getGroups()

		return result
	}

	static async createKey(ip) {
		try {
			const resp = await axios.post(`http://${ip}/api`, {
				devicetype: `CastMate#${os.userInfo().username}`,
			})

			console.log(resp.data)

			if (resp.data?.[0]?.success?.username) {
				return resp.data[0].success.username
			}
		} catch (err) {
			console.log(err)
			return undefined
		}
	}

	async getGroups() {
		const groups = await this.groupCache.get()
		//console.log(groups);
		return groups
	}

	async getScenes() {
		const scenes = await this.sceneCache.get()
		//console.log(scenes);
		return scenes
	}

	async getLights() {
		const lights = await this.lightCache.get()
		return lights
	}

	async getGroupByName(name) {
		const cachedGroups = await this.groupCache.get()
		const group = cachedGroups.find((g) => g.metadata.name == name)
		return group
	}

	async getSceneByName(groupName, sceneName) {
		const group = await this.getGroupByName(groupName)
		if (!group) return undefined
		const cachedScenes = await this.sceneCache.get()

		const scene = cachedScenes.find(
			(s) => s.metadata.name == sceneName && s.group.rid == group.id
		)
		return scene
	}

	async applyScene(sceneId) {
		const recall = {
			recall: {
				action: "active",
			},
		}

		try {
			await this.api.put(`/resource/scene/${sceneId}`, recall)
		} catch (err) {
			console.error(`HUE API ERROR: `)
			for (let errorStr of err?.response?.data?.errors) {
				console.error(errorStr)
			}
		}
	}

	getUpdate(on, color, duration) {
		const update = {}

		if (on != null || on != undefined) {
			update.on = { on: !!on }
		}

		if (color) {
			if ("bri" in color) {
				update.dimming = {
					brightness: clamp(Number(color.bri), 0, 100),
				}
			}
			if ("hue" in color || "sat" in color) {
				const hue = clamp(color.hue ?? 0, 0, 360)
				const sat = clamp(color.sat ?? 100, 0, 100)
				const bri = clamp(color.bri ?? 100, 0, 100)
				const cie = chromatism.convert({ h: hue, s: sat, v: bri }).xyY
				update.color = {
					xy: {
						x: cie.x,
						y: cie.y,
					},
				}
			}

			if ("kelvin" in color) {
				//Convert kelvin to mired. https://en.wikipedia.org/wiki/Mired
				update.ct = 1000000 / color.kelvin
			}
		}

		if (duration != null || duration != undefined) {
			update.dynamics = {
				duration: Math.round(duration),
			}
		}

		return update
	}

	async setLightState(id, on, color, duration) {
		const update = this.getUpdate(on, color, duration)

		try {
			await this.api.put(`/resource/light/${id}`, update)
		} catch (err) {
			console.error(`HUE API ERROR: `)
			for (let errorStr of err?.response?.data?.errors) {
				console.error(errorStr)
			}
		}
	}

	async setGroupState(id, on, color, duration) {
		console.log("Setting Group", id, on, color, duration)
		const update = this.getUpdate(on, color, duration)

		try {
			await this.api.put(`/resource/grouped_light/${id}`, update)
		} catch (err) {
			console.error(`HUE API ERROR: `)
			for (let errorStr of err?.response?.data?.errors) {
				console.error(errorStr)
			}
		}
	}
}

class HUEPlug extends Plug {
	constructor(apiObj) {
		super()
		this.id = apiObj.id
		this.config = {
			name: apiObj?.metadata?.name,
			plugin: "hue",
		}
	}

	async setPlugState(newState) {
		await super.setPlugState(newState)
		const api = this._getPlugin().pluginObj.hue
		await api?.setLightState(this.id, newState, null, 0)
	}

	async togglePlugState() {
		await super.togglePlugState()
	}
}

class HUEBulb extends Light {
	constructor(apiObj) {
		super()
		this.id = apiObj.id
		this.config = {
			name: apiObj?.metadata?.name,
			plugin: "hue",
			hueArchtype: apiObj?.metadata?.archetype,
		}
	}

	async setLightState(on, color, duration) {
		const api = this._getPlugin().pluginObj.hue
		await api?.setLightState(this.id, on, color, duration)
	}
}

class HUEGroup extends Light {
	constructor(apiObj) {
		super()
		const service = apiObj.services.find(s => s.rtype == 'grouped_light')

		this.id = service?.rid
		this.config = {
			name: apiObj?.metadata?.name,
			plugin: "hue",
		}
	}

	async setLightState(on, color, duration) {
		const api = this._getPlugin().pluginObj.hue
		await api?.setGroupState(this.id, on, color, duration)
	}
}

function isApiObjBulb(apiObj) {
	return (
		"color" in apiObj ||
		"color_temperature" in apiObj ||
		"dimming" in apiObj
	)
}

class HUEIotProvider {
	/**
	 *
	 * @param {HUEApi} api
	 */
	constructor(pluginObj) {
		this.pluginObj = pluginObj
	}

	async loadPlugs() {
		if (!this.pluginObj?.hue) {
			console.error("API MISSING")
			return []
		}

		const lights = await this.pluginObj.hue.getLights()

		const plugs = lights.filter((l) => !isApiObjBulb(l))

		return plugs.map((p) => new HUEPlug(p))
	}

	async loadLights() {
		if (!this.pluginObj?.hue) {
			console.error("API MISSING")
			return []
		}

		const lights = await this.pluginObj.hue.getLights()

		const groups = await this.pluginObj.hue.getGroups()

		console.log(groups[0])

		const bulbs = lights.filter((l) => isApiObjBulb(l))

		return [
			...bulbs.map((b) => new HUEBulb(b)),
			...groups.map((g) => new HUEGroup(g)),
		]
	}
}

export default {
	name: "hue",
	uiName: "HUE Lights",
	icon: "mdi-lightbulb-on-outline",
	color: "#7F743F",
	async init() {
		this.stateTracker = new HUEStateTracker()

		this.iotProvider = new HUEIotProvider(this)

		this.stateResetter = setInterval(() => {
			this.stateTracker.lastState = {}
		}, 60000)

		this.bridgeCache = this.getCache("bridgeCache")

		if (!(await this.checkForBridge())) {
			if (!(await this.discoverBridge())) {
				return false
			}
		}

		if (!(await this.loadKey())) {
			return false
		}

		if (!(await this.initApi())) {
			return false
		}

		return true
	},
	ipcMethods: {
		async getHubStatus() {
			return !!this.hue
		},
		async searchForHub() {
			return await this.forceAuth()
		},
	},
	methods: {
		async forceAuth() {
			this.hue = null

			if (!(await this.discoverBridge())) {
				return false
			}

			if (!(await this.createUser())) {
				console.error("Unable to create new hue user. Abandoning")
				return false
			}

			if (!(await this.initApi())) {
				return false
			}

			return true
		},
		async checkForBridge() {
			const cached = await this.bridgeCache.get()
			this.logger.info("Checking Cached Bridge")
			if (!cached?.bridgeIp) {
				this.logger.info("No Cached Bridge")
				return false
			}

			this.bridgeIp = cached.bridgeIp
			return true
		},
		async discoverBridge() {
			this.logger.info("Running HUE Discovery API")
			const resp = await axios.get("https://discovery.meethue.com/")
			const results = resp.data

			if (results.length == 0) {
				this.logger.error("Couldn't find hue bridge")
				return false
			} else {
				this.bridgeIp = results[0].internalipaddress
				this.bridgeCache.set({ bridgeIp: this.bridgeIp })
				return true
			}
		},
		async loadKey() {
			try {
				this.hueUser = JSON.parse(
					fs.readFileSync(
						path.join(userFolder, "secrets/hue.json"),
						"utf-8"
					)
				)
				return true
			} catch (err) {
				return false
			}
		},
		async createUser() {
			//Try to create user 5 times to allow for hue bridge button to be pressed.
			const retries = 6
			for (let i = 0; i < retries; ++i) {
				let key = await HUEApi.createKey(this.bridgeIp)

				if (key) {
					this.hueUser = {
						username: key,
					}

					fs.writeFileSync(
						path.join(userFolder, "secrets/hue.json"),
						JSON.stringify(this.hueUser)
					)

					return true
				}

				this.logger.error(
					"The link button on the bridge was not pressed. Press and try again."
				)

				if (i != retries - 1) {
					this.logger.info("Trying again in 5 seconds...")
					await sleep(5000)
				}
			}

			return false
		},
		async initApi() {
			try {
				console.log("Connecting to HUE")
				this.hue = await HUEApi.create(
					this.bridgeIp,
					this.hueUser.username
				)
				this.analytics.set({ usesHue: true })
				return true
			} catch (err) {
				console.error(
					"Unable to connect with user to bridge. Abandoning"
				)
				console.error(err)

				return false
			}
		},
		async handleTemplateNumber(value, context) {
			if (typeof value === "string" || value instanceof String) {
				return await evalTemplate(value, context)
			}
			return value
		},
		async getGroupNames() {
			try {
				return (await this.hue.getGroups()).map((g) => g.metadata.name)
			} catch (err) {
				for (let errorStr of err?.response?.data?.errors) {
					console.error(errorStr)
				}
				return []
			}
		},
		async getSceneNames(groupName) {
			try {
				const group = await this.hue.getGroupByName(groupName)
				if (!group) {
					console.log("No Group Found For Scenes")
					return []
				}

				let scenes = await this.hue.getScenes()
				scenes = scenes.filter((s) => s.group.rid == group.id)
				return scenes.map((s) => s.metadata.name)
			} catch (err) {
				this.logger.error(err)
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
			},
		},
	},
	secrets: {},
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
						falseIcon: "mdi-lightbulb-outline",
					},
					hsbk: {
						type: "LightColor",
						name: "Color",
						tempRange: [2000, 6500],
						required: true,
					},
					transition: {
						type: Number,
						template: true,
						name: "Transition Time",
						required: true,
						default: 0.5,
					},
					group: {
						type: String,
						template: true,
						name: "HUE Light Group",
						async enum() {
							return await this.getGroupNames()
						},
					},
				},
			},
			async handler(lightData, context) {
				lightData = _.cloneDeep(lightData)

				let groupName = lightData.group || this.settings.defaultGroup

				const requestedState = {}

				if ("on" in lightData) {
					lightData.on = await this.handleTemplateNumber(
						lightData.on,
						context
					)

					requestedState.on = !!lightData.on
				}

				if ("hsbk" in lightData) {
					const mode = lightData.hsbk.mode || "color"

					if (
						"bri" in lightData.hsbk &&
						(mode == "color" || mode == "template")
					) {
						lightData.hsbk.bri = await this.handleTemplateNumber(
							lightData.hsbk.bri,
							context
						)

						requestedState.bri = lightData.hsbk.bri
					}
					if (
						"sat" in lightData.hsbk &&
						(mode == "color" || mode == "template")
					) {
						lightData.hsbk.sat = await this.handleTemplateNumber(
							lightData.hsbk.sat,
							context
						)

						requestedState.sat = lightData.hsbk.sat
					}
					if (
						"hue" in lightData.hsbk &&
						(mode == "color" || mode == "template")
					) {
						lightData.hsbk.hue = await this.handleTemplateNumber(
							lightData.hsbk.hue,
							context
						)

						//Hue is 0-360
						requestedState.hue = lightData.hsbk.hue
					}
					if (
						"temp" in lightData.hsbk &&
						(mode == "temp" || mode == "template")
					) {
						lightData.hsbk.temp = await this.handleTemplateNumber(
							lightData.hsbk.temp,
							context
						)

						//Convert kelvin to mired. https://en.wikipedia.org/wiki/Mired
						requestedState.ct = 1000000 / lightData.hsbk.temp
					}
				}

				this.logger.info(`Hue Lights: ${JSON.stringify(lightData)}`)

				if ("transition" in lightData) {
					lightData.transition = await this.handleTemplateNumber(
						lightData.transition,
						context
					)

					requestedState.transition = lightData.transition * 1000
				}

				//let state = this.stateTracker.getGroupColorState(groupName, requestedState);

				let group = await this.hue.getGroupByName(groupName)

				if (!group) return

				const service = group.services.find(
					(s) => s.rtype == "grouped_light"
				)
				await this.hue.setGroupState(service.rid, requestedState)
			},
		},
		scene: {
			name: "Hue Scene",
			description: "Changes HUE lights to a hue scene",
			icon: "mdi-lightbulb-on-outline",
			color: "#7F743F",
			data: {
				type: Object,
				properties: {
					group: {
						type: String,
						template: true,
						name: "HUE Light Group",
						async enum() {
							return await this.getGroupNames()
						},
					},
					scene: {
						type: String,
						name: "Scene",
						async enum(context) {
							this.logger.info("Fetching Scenes for " + context)
							return await this.getSceneNames(context.group)
						},
						required: true,
					},
				},
			},
			async handler(sceneData) {
				let sceneName = sceneData.scene
				let groupName = sceneData.group || this.settings.defaultGroup

				this.stateTracker.clearGroupState(groupName)

				const scene = await this.hue.getSceneByName(
					groupName,
					sceneName
				)
				if (!scene) return

				this.hue.applyScene(scene.id)
			},
		},
	},
	settingsView: "hue",
}
