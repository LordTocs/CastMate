import { evalTemplate } from "../state/template.js"
import axios from "axios"
import crypto from "crypto"
import Color from "color"
import { IoTManager, IoTProvider, Light } from "../iot/iot-manager.js"
import { reactify } from "../state/reactive.js"
import dgram from "node:dgram"
import { clamp } from "lodash"

function randomBytes(num) {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(num, (err, buf) => {
			if (err) {
				reject(err)
			}
			resolve(buf)
		})
	})
}

async function getTwinklyInfo(ip) {
	const resp = await axios.get(`gestalt`, {
		baseURL: `http://${ip}/xled/v1/`,
	})

	const gestalt = resp.data
	return gestalt
}

class TwinklyDevice extends Light {
	constructor(id, ip) {
		super()

		this.id = `twinkly.${id}`
		this.config = {
			name: "",
			twinklyId: id,
			twinklyIp: ip,
			plugin: "twinkly",
			type: "bulb",
			rg: { available: true },
			kelvin: { available: false },
			dimming: { available: true },
		}

		this.state = reactify({
			on: false,
			color: null,
		})

		this.authToken = undefined
		this.tokenExpiry = undefined
	}

	get baseUrl() {
		return `http://${this.config.twinklyIp}/xled/v1/`
	}

	async _authenticate() {
		const randomBuffer = await randomBytes(32)
		const challenge = randomBuffer.toString("base64")

		try {
			const resp = await axios.post(
				"login",
				{ challenge },
				{
					baseURL: this.baseUrl,
				}
			)

			const challengeResp = resp.data["challenge-response"]
			if (!challengeResp) return false

			this.authToken = resp.data.authentication_token
			if (!resp.data.authentication_token_expires_in) return false

			this.tokenExpiry =
				Date.now() +
				resp.data.authentication_token_expires_in * 1000 -
				5 * 1000
			if (!this.authToken) return false

			await axios.post(
				"verify",
				{
					"challenge-response": challengeResp,
				},
				{
					baseURL: this.baseUrl,
					headers: {
						"X-Auth-Token": this.authToken,
					},
				}
			)
		} catch (err) {
			console.error("Failed Twinkly Auth", err.response.data)
			console.error(err)
			return false
		}
	}

	get _hasAuth() {
		if (this.authToken == null) return false
		if (this.tokenExpiry == null) return false
		const now = Date.now()
		if (this.tokenExpiry < now) {
			return false
		}
		return true
	}

	async _getApi(path) {
		if (!this._hasAuth) {
			await this._authenticate()
		}

		if (!this._hasAuth) return

		try {
			const resp = await axios.get(path, {
				baseURL: this.baseUrl,
				headers: {
					"X-Auth-Token": this.authToken,
				},
			})

			return resp.data
		} catch (err) {
			console.log("Error w/", path)
			console.log(err.response.data)

			if (err.response.data == "Invalid Token") {
				console.error(`get ${path} failed, reauthing`)

				await this._authenticate()

				const resp = await axios.get(path, {
					baseURL: this.baseUrl,
					headers: {
						"X-Auth-Token": this.authToken,
					},
				})

				return resp.data
			} else {
				throw err
			}
		}
	}

	async _postApi(path, data) {
		if (!this._hasAuth) {
			await this._authenticate()
		}

		if (!this._hasAuth) return

		try {
			const resp = await axios.post(path, data, {
				baseURL: this.baseUrl,
				headers: {
					"X-Auth-Token": this.authToken,
				},
			})

			return resp.data
		} catch (err) {
			console.log("Error w/", path)
			console.log(err.response.data)

			if (err.response.data == "Invalid Token") {
				console.error(`get ${path} failed, reauthing`)

				await this._authenticate()

				const resp = await axios.post(path, data, {
					baseURL: this.baseUrl,
					headers: {
						"X-Auth-Token": this.authToken,
					},
				})

				return resp.data
			} else {
				throw err
			}
		}
	}

	async _getMode() {
		const data = await this._getApi("/led/mode")
		return data.mode
	}

	async _setMode(mode) {
		await this._postApi("/led/mode", {
			mode,
			effect_id: 0,
		})
	}

	async _getColor() {
		const data = await this._getApi("/led/color")
		return { hue: data.hue, sat: data.saturation, bri: data.value }
	}

	async getMovies() {
		const data = await this._getApi("/movies")
		return data.movies
	}

	async setMovie(id) {
		try {
			await this._postApi("/movies/current", {
				id,
			})

			await this._setMode("movie")
		} catch (err) {
			console.error("Failed to set twinkly movie", id, "on", ip)
		}
	}

	startPolling() {
		if (this.pollInterval) {
			clearInterval(this.pollInterval)
		}

		this.pollInterval = setInterval(() => this.poll(), 30000)
	}

	async poll() {
		const mode = await this._getMode()
		this.state.on = mode != "off"

		this.color = await this._getColor()
	}

	async initialize() {
		const info = await getTwinklyInfo(this.config.twinklyIp)

		this.config.name = info.device_name

		await this.poll()

		this.startPolling()
	}

	async setLightState(on, color, duration) {
		if (on == "toggle") {
			await this.poll()
			on = !this.state.on
		}

		if (!on) {
			await this._setMode("off")
		} else {
			if (color) {
				if ("hue" in color || "sat" in color || "bri" in color) {
					const hue = Math.ceil(clamp(color.hue ?? 0, 0, 360))
					const saturation =
						(255 * Math.ceil(clamp(color.sat ?? 100, 0, 100))) / 100
					const value =
						(255 * Math.ceil(clamp(color.bri ?? 100, 0, 100))) / 100

					await this._postApi("/led/color", {
						hue,
						saturation,
						value,
					})
				}
			}

			await this._setMode("color")
		}
	}
}

class TwinklyIoTProvider extends IoTProvider {
	constructor(pluginObj) {
		super("twinkly")

		this.pluginObj = pluginObj

		this.socket = dgram.createSocket("udp4")
		this.interval = undefined
	}

	async initServices() {
		await this._bind()

		this.socket.setBroadcast(true)

		this.socket.on("message", async (msg, rinfo) => {
			if (msg.length < 4 + 2 + 2) {
				//4 byte ip, 2 byte OK, 1 byte, 1 null terminator
				console.error("Mystery Twinkly Message")
				return
			}

			const ip = `${msg.readUint8(3)}.${msg.readUint8(2)}.${msg.readUint8(
				1
			)}.${msg.readUint8()}`
			const id = msg.subarray(6).toString("ascii")

			//console.log("Discovered Twinkly", id, ip)

			const existingLight = this.lights.find((l) => {
				return l.id == `twinkly.${id}`
			})

			if (existingLight) {
				//console.log("Already have Twinkly", id, ip)
				return
			}

			const twinklyDevice = new TwinklyDevice(id, ip)
			await twinklyDevice.initialize()
			await this._addNewLight(twinklyDevice)
		})

		this.socket.on("error", (err) => {
			console.error("Twinkly Discovery Error", err)
		})

		this.startPolling()
	}

	_bind() {
		return new Promise((resolve, reject) => {
			this.socket.bind(undefined, undefined, () => {
				resolve()
			})
		})
	}

	startPolling() {
		if (this.interval) {
			clearInterval(this.interval)
		}

		this.interval = setInterval(() => this.poll(), 30 * 1000)
		this.poll()
	}

	async poll() {
		let subnetMask = this.pluginObj.settings?.subnetMask?.trim()
		if (!subnetMask) subnetMask = "255.255.255.255"

		this.socket.send(
			Buffer.from([0x01, 0x64, 0x69, 0x73, 0x63, 0x6f, 0x76, 0x65, 0x72]),
			5555,
			subnetMask
		)
	}

	async loadPlugs() {
		return []
	}

	async loadLights() {
		return []
	}
}

export default {
	name: "twinkly",
	uiName: "Twinkly",
	icon: "mdi-string-lights",
	color: "#7F743F",
	async init() {
		this.logger.info("Twinkly Effects")
		this.iotProvider = new TwinklyIoTProvider(this)
	},
	methods: {},
	settings: {
		subnetMask: {
			type: String,
			name: "Twinkly Subnet Mask",
			default: "255.255.255.255",
		},
	},
	secrets: {},
	state: {},
	actions: {
		twinklyMovie: {
			name: "Twinkly Movie",
			description: "Play a twinkly movie.",
			color: "#607A7F",
			icon: "mdi-string-lights",
			data: {
				type: Object,
				properties: {
					device: {
						type: Light,
						name: "Twinly Device",
						filter: {
							plugin: "twinkly",
						},
					},
					movie: {
						type: String,
						async enum(context) {
							try {
								const twinklyDevice =
									IoTManager.getInstance().lights.getById(
										context.device
									)
								const movies = await twinklyDevice.getMovies()
								return movies.map((m) => ({
									name: m.name,
									value: m.id,
								}))
							} catch (err) {
								console.error("Error getting movies", err)
								return []
							}
						},
					},
				},
			},
			async handler(twinklyData, context) {
				const device = IoTManager.getInstance().lights.getById(
					twinklyData.device
				)

				if (!device) return

				await device.setMovie(twinklyData.movie)
			},
		},
	},
}
