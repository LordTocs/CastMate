import { clamp } from "lodash"
import bonjour from "bonjour"
import { IoTProvider, Light, Plug } from "../iot/iot-manager"
import { reactify } from "../state/reactive"
import * as chromatism from "chromatism2"
import axios from "axios"
import util from "util"

function elgatoToKelvin(value) {
	return Math.round((-4100 * value) / 201 + 1993300 / 201)
}

function kelvinToElgato(kelvin) {
	return Math.round(((kelvin - 1993300 / 201) * 201) / -4100)
}

class ElgatoKeyLight extends Light {
	/**
	 *
	 * @param {bonjour.RemoteService} service
	 */
	constructor(service) {
		super()

		const ip = service.referer.address
		const port = service.port
		this.axios = axios.create({
			baseURL: `http://${ip}:${port}/elgato`,
		})
		this.id = "elgato." + service.txt.id

		this.state = reactify({
			on: false,
			color: null,
		})
	}

	startPolling() {
		this.poll()
		setInterval(() => this.poll(), 30 * 1000)
	}

	async poll() {
		const lightState = await this.axios.get("lights")

		const state = lightState.data.lights[0]
		this.state.on = state.on

		const bri = state.brightness
		const kelvin = elgatoToKelvin(state.temperature)

		this.state.color = { bri, kelvin }
	}

	async init() {
		const info = await this.axios.get("accessory-info")

		this.config = {
			name: info.data.displayName,
			plugin: "elgato",
			type: "bulb",
			rgb: {
				available: false,
			},
			kelvin: {
				available: true,
				min: elgatoToKelvin(143),
				max: elgatoToKelvin(344),
			},
			dimming: {
				available: true,
			},
		}

		this.startPolling()
	}

	async setLightState(on, color, duration) {
		if (on == "toggle") {
			on = !this.state.on
		}
		on = on ?? this.state.on

		const brightness = color?.bri ?? this.state.color?.bri ?? 100
		const kelvin = color?.kelvin ?? this.state.color?.kelvin ?? 3000
		const temperature = kelvinToElgato(kelvin)

		this.state.on = on
		this.state.color = { bri: brightness, kelvin }

		await this.axios.put("lights", {
			numberOfLights: 1,
			lights: [
				{
					on,
					brightness,
					temperature,
				},
			],
		})
	}
}

class ElgatoLightStrip extends Light {
	/**
	 *
	 * @param {bonjour.RemoteService} service
	 */
	constructor(service) {
		super()

		const ip = service.referer.address
		const port = service.port
		this.axios = axios.create({
			baseURL: `http://${ip}:${port}/elgato`,
		})
		this.id = "elgato." + service.txt.id

		this.state = reactify({
			on: false,
			color: null,
		})
	}

	startPolling() {
		this.poll()
		setInterval(() => this.poll(), 30 * 1000)
	}

	async poll() {
		const lightState = await this.axios.get("lights")

		const state = lightState.data.lights[0]
		this.state.on = state.on

		const bri = state.brightness
		if (state.temperature) {
			const kelvin = elgatoToKelvin(state.temperature)
			this.state.color = { bri, kelvin }
		} else {
			this.state.color = { bri, hue: state.hue, sat: state.saturation }
		}
	}

	async init() {
		const info = await this.axios.get("accessory-info")
		const lights = await this.axios.get("lights")

		this.config = {
			name: info.data.displayName,
			plugin: "elgato",
			type: "bulb",
			rgb: {
				available: true,
			},
			kelvin: {
				available: true,
				min: elgatoToKelvin(143),
				max: elgatoToKelvin(344),
			},
			dimming: {
				available: true,
			},
			numberOfLights: lights.data.numberOfLights,
		}

		this.startPolling()
	}

	async setLightState(on, color, duration) {
		if (on == "toggle") {
			on = !this.state.on
		}
		on = on ?? this.state.on

		const brightness = color?.bri ?? this.state.color?.bri ?? 100

		const lightState = {
			on,
			brightness,
		}

		this.state.on = on

		if (color) {
			if ("kelvin" in color) {
				const kelvin = color?.kelvin ?? this.state.color?.kelvin ?? 3000
				lightState.temperature = kelvinToElgato(kelvin)
				this.state.color = { bri: brightness, kelvin }
			} else if ("sat" in color || "hue" in color) {
				const sat = color?.sat ?? this.state.color?.sat ?? 100
				const hue = color?.hue ?? this.state.color?.hue ?? 0
				lightState.saturation = sat
				lightState.hue = hue
				this.state.color = { bri: brightness, sat, hue }
			}
		}

		await this.axios.put("lights", {
			numberOfLights: this.config.numberOfLights,
			lights: new Array(this.config.numberOfLights).fill(lightState),
		})
	}
}

class ElgatoIoTProvider extends IoTProvider {
	constructor(pluginObj) {
		super("elgato")
		this.pluginObj = pluginObj
		this.bonjour = bonjour()
	}

	async initServices() {
		this.keylightBrowser = this.bonjour.find(
			{ type: "elg" },
			async (service) => {
				console.log(util.inspect(service))
				if (service.txt.md.includes("Key")) {
					const light = new ElgatoKeyLight(service)
					try {
						//console.log("Elgato Light!")
						await light.init()

						await this._addNewLight(light)
					} catch (err) {
						console.error(err)
					}
				} else {
					//Light strip?
					const light = new ElgatoLightStrip(service)
					try {
						//console.log("Elgato Light!")
						await light.init()

						await this._addNewLight(light)
					} catch (err) {
						console.error(err)
					}
				}
			}
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
	name: "elgato",
	uiName: "Elgato",
	icon: "mdi-lightbulb-on-outline",
	color: "#7F743F",
	async init() {
		this.iotProvider = new ElgatoIoTProvider(this)
	},
}
