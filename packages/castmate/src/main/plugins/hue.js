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
import { Plug, Light, IoTProvider } from "../iot/iot-manager.js"
import EventSource from "eventsource"
import { IoTManager } from "../iot/iot-manager.js"
import { reactify } from "../state/reactive.js"


function xyToHueSat({x, y}) {
	const z = 1.0 - x - y;

	const Y = 100;
	const X = (Y / y) * x;
	const Z = (Y / y) * z;

	const hsv = chromatism.convert({ X, Y, Z}).hsv

	return { hue: hsv.h, sat: hsv.s }
}

class HUEApi {
	static async create(ip, key) {
		const result = new HUEApi()

		// The cert provided in the HUE docs does not appear to work. So for now, ignore https.
		const httpsAgent = new https.Agent({
			rejectUnauthorized: false,
		})

		result.bridgeIp = ip
		result.key = key
		result.api = axios.create({
			baseURL: `https://${ip}/clip/v2`,
			headers: {
				"hue-application-key": key,
			},
			httpsAgent,
		})

		await result.getLights()

		result._connectEventSource()

		return result
	}

	_connectEventSource() {
		console.log("Connecting HUE events")

		console.log(
			"HUE EVENTS: ",
			`https://${this.bridgeIp}/eventstream/clip/v2`,
			this.key
		)

		this.eventsource = new EventSource(
			`https://${this.bridgeIp}/eventstream/clip/v2`,
			{
				headers: {
					"hue-application-key": this.key,
				},
				https: { rejectUnauthorized: false },
				rejectUnauthorized: false,
			}
		)

		this.eventsource.onmessage = (message) => this._handleEvent(message)
		this.eventsource.onerror = (err) => {
			console.error("HUE EventError", err)
			this.eventsource.close()
			this.eventsource = null
			this._tryReconnect()
		}
		this.eventsource.onopen = (event) => {
			console.log("HUE EventSource Open", event)
		}
	}

	_tryReconnect() {
		this.shouldReconnect = true
		this.reconnectTimeout = setTimeout(() => {
			if (this.shouldReconnect) {
				this._connectEventSource()
			}
		}, 5000)
	}

	_handleEvent(message) {
		try {
			const data = JSON.parse(message.data)
			for (let event of data) {
				if (event?.type == "update") {
					for (let subEvent of event?.data) {
						try {
							this?.onHueUpdate(subEvent)
						}
						catch(err) {
							console.error("Error Updating Hue", err)
						}
					}
				}
			}
		} catch (err) {
			
		}
	}

	shutdown() {
		this.eventsource?.close()
		this.shouldReconnect = false
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout)
		}
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
		const resp = await this.api.get(`/resource/room`)
		const groups = resp.data.data
		return groups
	}

	async getScenes() {
		const resp = await this.api.get(`/resource/scene`)
		const scenes = resp.data.data
		return scenes
	}

	async getLights() {
		const resp = await this.api.get(`/resource/light`)
		return resp.data.data
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
				update.color_temperature = {
					mirek: Math.round(1000000 / color.kelvin)
				}
			}
		}

		if (duration != null) {
			update.dynamics = {
				duration: Math.round(duration * 1000),
			}
		}

		return update
	}

	async setLightState(id, on, color, duration) {
		const update = this.getUpdate(on, color, duration)
		console.log(update)
		try {
			await this.api.put(`/resource/light/${id}`, update)
		} catch (err) {
			console.error(`HUE API ERROR: `)
			console.error(err?.response?.data)
		}
	}

	async setGroupState(id, on, color, duration) {
		console.log("Setting Group", id, on, color, duration)
		const update = this.getUpdate(on, color, duration)

		try {
			await this.api.put(`/resource/grouped_light/${id}`, update)
		} catch (err) {
			console.error(`HUE API ERROR: `)
			console.error(err?.response?.data)
			for (let errorStr of err?.response?.data?.errors ?? []) {
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
		this.state = reactify({
			on: !!apiObj?.on?.on,
		})
	}

	async setPlugState(on) {
		await super.setPlugState(on)
		if (on == "toggle") {
			on = !this.state.on
		}
		const api = this._getPlugin().pluginObj.hue
		await api?.setLightState(this.id, on, null, 0)
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
			rgb: { available: !!apiObj.color },
			dimming: { available: !!apiObj.dimming },
			kelvin: { available: !!apiObj.color_temperature }
		}

		if (this.config.kelvin.available) {
			this.config.kelvin.min = 1000000 / apiObj.color_temperature?.mirek_schema?.mirek_minimum
			this.config.kelvin.max = 1000000 / apiObj.color_temperature?.mirek_schema?.mirek_maximum
		}

		const color = {
			bri: apiObj?.dimming?.brightness ?? 100,
		}
		if (apiObj?.color_temperature?.mirek_valid) {
			color.kelvin = 1000000 / apiObj.color_temperature.mirek
		} else if (apiObj?.color?.xy) {
			const {hue, sat} = xyToHueSat(apiObj?.color?.xy)
			color.hue = hue
			color.sat = sat
		}

		this.state = reactify({
			on: !!apiObj?.on?.on,
			color
		})
	}

	async setLightState(on, color, duration) {
		const api = this._getPlugin().pluginObj.hue
		if (on == "toggle") {
			on = !this.state.on
		}
		await api?.setLightState(this.id, on, color, duration)
	}
}

class HUEGroup extends Light {
	constructor(apiObj) {
		super()
		const service = apiObj.services.find((s) => s.rtype == "grouped_light")

		this.id = service?.rid
		this.config = {
			name: apiObj?.metadata?.name,
			plugin: "hue",
			rgb: { available: !!apiObj.color },
			dimming: { available: !!apiObj.dimming },
			kelvin: { available: !!apiObj.color_temperature }
		}

		if (this.config.kelvin.available) {
			this.config.kelvin.min = 1000000 / apiObj.color_temperature?.mirek_schema?.mirek_minimum
			this.config.kelvin.max = 1000000 / apiObj.color_temperature?.mirek_schema?.mirek_maximum
		}

		const color = {
			bri: apiObj?.dimming?.brightness ?? 100,
		}
		if (apiObj?.color_temperature?.mirek_valid) {
			color.kelvin = 1000000 / apiObj.color_temperature.mirek
		} else if (apiObj?.color?.xy) {
			const {hue, sat} = xyToHueSat(apiObj?.color?.xy)
			color.hue = hue
			color.sat = sat
		}

		this.state = reactify({
			on: !!apiObj?.on?.on,
			color
		})
	}

	async setLightState(on, color, duration) {
		const api = this._getPlugin().pluginObj.hue
		if (on == "toggle") {
			on = !this.state.on
		}
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

class HUEIotProvider extends IoTProvider {
	/**
	 *
	 * @param {HUEApi} api
	 */
	constructor(pluginObj) {
		super()
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
		this.iotProvider = new HUEIotProvider(this)

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
				this.hue?.shutdown()

				console.log("Connecting to HUE")

				this.hue = await HUEApi.create(
					this.bridgeIp,
					this.hueUser.username
				)

				this.hue.onHueUpdate = (update) => {
					const plug = IoTManager.getInstance().plugs.getById(update.id)
					const light = IoTManager.getInstance().lights.getById(update.id)

					if (plug) {
						if (update.on) {
							plug.state.on = !!update.on.on
						}
					}
					if (light) {
						if (update.on) {
							light.state.on = !!update.on.on
						}
						if (update.dimming || update.color || update.color_temperature) {
							//We have to update the WHOLE color object because our reactivity isn't deep
							const newColor = {
								...light.state.color,
								bri: update.dimming?.brightness ?? light.state.color.bri
							}

							if (update.color_temperature?.mirek_valid) {
								newColor.kelvin = 1000000 / update.color_temperature.mirek;
								delete newColor.hue
								delete newColor.sat
							} else if (update.color?.xy) {
								
								const {hue, sat} = xyToHueSat(update.color.xy)
								newColor.hue = hue
								newColor.sat = sat
								delete newColor.kelvin
							}

							light.state.color = newColor
						}
					}
				}

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
	actions: {
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
