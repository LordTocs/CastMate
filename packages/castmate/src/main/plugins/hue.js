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

function xyToHueSat({ x, y }) {
	const z = 1.0 - x - y

	const Y = 100
	const X = (Y / y) * x
	const Z = (Y / y) * z

	const hsv = chromatism.convert({ X, Y, Z }).hsv

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

		result.sceneCache = new AsyncCache(async () => {
			const resp = await result.api.get(`/resource/scene`)
			const scenes = resp.data.data
			return scenes
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
						} catch (err) {
							console.error("Error Updating Hue", err)
						}
					}
				} else if (event?.type == "add") {
					console.log("Add Event", event, event?.data)
				} else if (event?.type == "error") {
					console.log("Error Event", event)
				}
			}
		} catch (err) {}
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

			//console.log(resp.data)

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
		return await this.sceneCache.get()
	}

	async getLights() {
		const resp = await this.api.get(`/resource/light`)
		return resp.data.data
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
					mirek: Math.round(1000000 / color.kelvin),
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
		try {
			await this.api.put(`/resource/light/${id}`, update)
		} catch (err) {
			console.error(`HUE API ERROR: `)
			console.error(err?.response?.data)
		}
	}

	async setGroupState(id, on, color, duration) {
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
		this.id = "hue." + apiObj.id
		this.config = {
			hueId: apiObj.id,
			name: apiObj?.metadata?.name,
			plugin: "hue",
			type: "bulb",
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
		const api = this._getPlugin().hue
		await api?.setLightState(this.config.hueId, on, null, 0)
	}
}

class HUEBulb extends Light {
	constructor(apiObj) {
		super()
		this.id = "hue." + apiObj.id
		this.config = {
			name: apiObj?.metadata?.name,
			hueId: apiObj.id,
			plugin: "hue",
			hueArchtype: apiObj?.metadata?.archetype,
			rgb: { available: !!apiObj.color },
			dimming: { available: !!apiObj.dimming },
			kelvin: { available: !!apiObj.color_temperature },
		}

		if (this.config.kelvin.available) {
			this.config.kelvin.min =
				1000000 / apiObj.color_temperature?.mirek_schema?.mirek_minimum
			this.config.kelvin.max =
				1000000 / apiObj.color_temperature?.mirek_schema?.mirek_maximum
		}

		const color = {
			bri: apiObj?.dimming?.brightness ?? 100,
		}
		if (apiObj?.color_temperature?.mirek_valid) {
			color.kelvin = 1000000 / apiObj.color_temperature.mirek
		} else if (apiObj?.color?.xy) {
			const { hue, sat } = xyToHueSat(apiObj?.color?.xy)
			color.hue = hue
			color.sat = sat
		}

		this.state = reactify({
			on: !!apiObj?.on?.on,
			color,
		})
	}

	async setLightState(on, color, duration) {
		const api = this._getPlugin().hue
		if (on == "toggle") {
			on = !this.state.on
		}
		await api?.setLightState(this.config.hueId, on, color, duration)
	}
}

class HUEGroup extends Light {
	constructor(apiObj) {
		super()

		const service = apiObj.services.find((s) => s.rtype == "grouped_light")

		this.id = "hue." + apiObj.id

		this.config = {
			name: apiObj?.metadata?.name,
			plugin: "hue",
			type: "group",
			hueRoomId: apiObj.id,
			hueGroupId: service?.rid,
			rgb: { available: true },
			dimming: { available: true },
			kelvin: { available: true, min: 2000, max: 6535 },
		}

		const color = {
			bri: apiObj?.dimming?.brightness ?? 100,
		}
		if (apiObj?.color_temperature?.mirek_valid) {
			color.kelvin = 1000000 / apiObj.color_temperature.mirek
		} else if (apiObj?.color?.xy) {
			const { hue, sat } = xyToHueSat(apiObj?.color?.xy)
			color.hue = hue
			color.sat = sat
		}

		this.state = reactify({
			on: !!apiObj?.on?.on,
			color,
		})
	}

	async setLightState(on, color, duration) {
		const api = this._getPlugin().hue
		if (on == "toggle") {
			on = !this.state.on
		}
		await api?.setGroupState(this.config.hueGroupId, on, color, duration)
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
		super("hue")
		this.pluginObj = pluginObj
	}

	async initServices() {
		console.log("Connecting to HUE")

		this.hue?.shutdown()
		this.clearResources()

		if (!this.pluginObj.bridgeIp || !this.pluginObj.hueUser) {
			return
		}

		this.hue = await HUEApi.create(
			this.pluginObj.bridgeIp,
			this.pluginObj.hueUser.username
		)

		this.hue.onHueUpdate = (update) => {
			const plug = IoTManager.getInstance().plugs.getById(
				`hue.${update.id}`
			)
			const light = IoTManager.getInstance().lights.getById(
				`hue.${update.id}`
			)

			//console.log(update, plug?.id, light?.id)

			if (plug) {
				if (update.on) {
					plug.state.on = !!update.on.on
				}
			}
			if (light) {
				if (update.on) {
					light.state.on = !!update.on.on
				}
				if (
					update.dimming ||
					update.color ||
					update.color_temperature
				) {
					//We have to update the WHOLE color object because our reactivity isn't deep
					const newColor = {
						...light.state.color,
						bri:
							update.dimming?.brightness ?? light.state.color.bri,
					}

					if (update.color_temperature?.mirek_valid) {
						newColor.kelvin =
							1000000 / update.color_temperature.mirek
						delete newColor.hue
						delete newColor.sat
					} else if (update.color?.xy) {
						const { hue, sat } = xyToHueSat(update.color.xy)
						newColor.hue = hue
						newColor.sat = sat
						delete newColor.kelvin
					}

					light.state.color = newColor
				}
			}
		}
	}

	async loadPlugs() {
		if (!this.hue) {
			console.error("API MISSING")
			return []
		}

		const lights = await this.hue.getLights()

		const plugs = lights.filter((l) => !isApiObjBulb(l))

		return plugs.map((p) => new HUEPlug(p))
	}

	async loadLights() {
		if (!this.hue) {
			console.error("API MISSING")
			return []
		}

		const lights = await this.hue.getLights()

		const groups = await this.hue.getGroups()

		const bulbs = lights.filter((l) => isApiObjBulb(l))

		return [
			...bulbs.map((b) => new HUEBulb(b)),
			...groups.map((g) => new HUEGroup(g)),
		]
	}

	async reauth() {
		if (!this.inited) return

		await this.initServices()

		const plugs = await this.loadPlugs()
		const lights = await this.loadLights()

		for (let light of lights) {
			this._addNewLight(light)
		}

		for (let plug of plugs) {
			this._addNewPlug(plug)
		}
	}
}

//We REALLY need to figure out how to add specific svgs to the icon system. This is ridiculous.
const icon =
	"svg:m 2.324376,13.397973 v 2.206938 c 0,0.10955 0.044212,0.21458 0.122927,0.292041 0.078697,0.07745 0.1854731,0.120978 0.2967687,0.120978 0.111333,0 0.2180762,-0.04351 0.296794,-0.120978 0.078722,-0.07747 0.1229585,-0.182497 0.1229585,-0.292041 v -2.206938 z m 4.3130841,0 v 2.206938 c 0,0.05422 0.010865,0.107949 0.031933,0.158043 0.021084,0.05014 0.052002,0.09564 0.090984,0.133998 0.039008,0.03839 0.085264,0.06878 0.1361913,0.08952 0.050929,0.02082 0.1055052,0.03144 0.160599,0.03144 0.055137,0 0.1097298,-0.01078 0.1606416,-0.03144 0.050931,-0.02074 0.097191,-0.05114 0.1361603,-0.08952 0.038961,-0.03836 0.069875,-0.08386 0.090981,-0.133998 0.021082,-0.05009 0.031957,-0.103806 0.031957,-0.158043 v -2.206938 z m 6.8502119,0 v 0.200361 c 0,1.054143 -0.764269,1.880204 -1.741509,1.880204 -1.158928,0 -1.719609,-0.616468 -1.719609,-1.849374 V 13.397973 H 9.1870923 v 0.26816 c 0,1.62746 0.779951,2.465828 2.3147477,2.465828 0.407452,0.02105 0.812108,-0.07686 1.16318,-0.28146 0.351077,-0.204516 0.632928,-0.506566 0.810118,-0.868211 v -0.02775 0.684268 c 0,0.109562 0.04425,0.214613 0.122924,0.292049 0.07874,0.07749 0.1855,0.121016 0.296797,0.121016 0.111322,0 0.218077,-0.04353 0.296798,-0.121016 0.07873,-0.07743 0.122938,-0.182493 0.122938,-0.292049 V 13.397981 Z M 9.1870923,10.55609 v 2.225413 H 10.026554 V 10.55609 c 0,-0.109562 -0.04425,-0.21457 -0.1229507,-0.292029 -0.07868,-0.07749 -0.18547,-0.12099 -0.296761,-0.12099 -0.111322,0 -0.218069,0.04351 -0.296792,0.12099 -0.07871,0.07745 -0.122952,0.182473 -0.122953,0.292029 z m 4.3005797,0 v 2.225413 h 0.839453 V 10.55609 c 0,-0.109562 -0.04423,-0.21457 -0.122949,-0.292029 -0.07874,-0.07749 -0.185461,-0.12099 -0.296798,-0.12099 -0.111299,0 -0.218075,0.04351 -0.29676,0.12099 -0.07871,0.07745 -0.122951,0.182473 -0.122951,0.292029 z m 3.407882,2.197705 c 0.09708,-1.257578 0.939662,-2.068241 2.136171,-2.068241 0.917763,0 1.879342,0.545554 1.879342,2.071323 v 0.02464 h -4.018663 z m -0.858259,0.02769 h -0.535586 c -0.08309,0 -0.162743,0.03251 -0.221494,0.09027 -0.05877,0.05784 -0.09175,0.13623 -0.09175,0.217959 0,0.08179 0.033,0.160151 0.09175,0.217963 0.05875,0.05781 0.138406,0.09028 0.221494,0.09028 h 0.535586 c 0.122161,1.661371 1.331229,2.721682 3.157324,2.721682 0.646174,0.02236 1.289,-0.101024 1.879357,-0.360639 0.07769,-0.02473 0.143988,-0.0757 0.186994,-0.144021 0.04302,-0.0683 0.06004,-0.149437 0.04789,-0.228947 -0.0039,-0.03903 -0.01648,-0.07679 -0.03705,-0.110402 -0.02062,-0.03363 -0.0486,-0.06225 -0.08197,-0.08378 -0.05352,-0.02427 -0.111787,-0.0369 -0.170723,-0.0369 -0.05894,0 -0.117188,0.0125 -0.170682,0.0369 -0.103385,0.03091 -0.194219,0.0647 -0.285059,0.09555 -0.410612,0.158006 -0.849831,0.231452 -1.290461,0.215772 -1.412675,0 -2.346067,-0.810646 -2.38053,-2.071308 v -0.03392 h 4.385169 c 0.05232,0.0061 0.105429,5.65e-4 0.155583,-0.01459 0.05022,-0.01596 0.09627,-0.04244 0.135005,-0.0776 0.03874,-0.03521 0.06922,-0.07826 0.08936,-0.126213 0.02014,-0.04793 0.0295,-0.09964 0.02718,-0.151511 v -0.04621 c 0,-2.703197 -2.054764,-2.915843 -2.684354,-2.915843 -0.757311,-0.02097 -1.49257,0.252144 -2.046999,0.760234 -0.554416,0.508097 -0.883494,1.210413 -0.916096,1.955249 z M 2.324376,8.2782463 v 4.5032557 h 0.8394479 c 0,-0.992496 0.5825712,-2.062057 1.8605392,-2.062057 1.0398928,0 1.613097,0.659637 1.613097,1.849415 v 0.212642 h 0.8394636 v -0.194189 c 0,-1.627462 -0.7861999,-2.524412 -2.2082328,-2.524412 -0.4082009,-0.02578 -0.815153,0.06603 -1.1711684,0.264178 -0.3560255,0.198174 -0.6456324,0.494111 -0.8334619,0.85164 l -0.109639,0.221906 V 8.2782463 c 0,-0.1095278 -0.044237,-0.2145766 -0.1229571,-0.292059 C 2.9527785,7.9087333 2.846,7.8652367 2.7347078,7.8652367 c -0.1113319,0 -0.2180931,0.043495 -0.296815,0.1209506 -0.078702,0.077488 -0.1229216,0.1825278 -0.1229216,0.292059"

export default {
	name: "hue",
	uiName: "Philips Hue",
	icon,
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

		return true
	},
	ipcMethods: {
		async getHubStatus() {
			return !!this.iotProvider.hue
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

			await this.iotProvider.reauth()

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
				console.log("Error loading key", err)
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
	},
	actions: {
		scene: {
			name: "Hue Scene",
			description: "Changes a hue room to a specific scene.",
			icon: "mdi-lightbulb-group-outline",
			color: "#7F743F",
			data: {
				type: Object,
				properties: {
					group: {
						type: Light,
						name: "HUE Light Group",
						filter: {
							plugin: "hue",
							type: "group",
						},
					},
					scene: {
						type: String,
						name: "Scene",
						async enum(context) {
							let scenes = await this.iotProvider.hue.getScenes()

							const lightGroup =
								IoTManager.getInstance().lights.getById(
									context.group
								)

							if (!lightGroup) return

							scenes = scenes.filter(
								(s) =>
									s.group.rid == lightGroup.config.hueRoomId
							)
							return scenes.map((s) => ({
								name: s.metadata.name,
								value: s.id,
							}))
						},
						required: true,
					},
				},
			},
			async handler(sceneData) {
				this.iotProvider.hue.applyScene(sceneData.scene)
			},
		},
	},
	settingsView: "hue",
}
