import { clamp } from "lodash"
import { Client } from "lifx-lan-client"
import { IoTProvider, Light, Plug } from "../iot/iot-manager"
import { reactify } from "../state/reactive"

class LIFXBulb extends Light {
	/**
	 *
	 * @param {import("lifx-lan-client").Light} light
	 */
	constructor(light, initialState, hardwareInfo) {
		super()
		this.light = light
		this.id = "lifx." + light.id

		this.config = {
			name: initialState.label,
			plugin: "lifx",
			type: "bulb",
			rgb: { available: hardwareInfo.productFeatures.color },
			kelvin: { available: true, min: 2500, max: 9000 },
			dimming: { available: true },
		}

		this.state = reactify({
			on: false,
			color: null,
		})

		this.startPolling()
	}

	getCurrentState() {
		return new Promise((resolve, reject) => {
			this.light.getState((err, data) => {
				if (err) {
					return reject(err)
				}

				const state = {
					on: !!data.power,
					color: {
						bri: data.color.brightness,
					},
				}

				if (data.color.saturation == 0) {
					state.color.kelvin = data.color.kelvin
				} else {
					state.color.hue = data.color.hue
					state.color.sat = data.color.saturation
				}

				resolve(state.color)
			})
		})
	}

	async updateState() {
		const state = await this.getCurrentState()
		this.state.on = state.on
		this.state.color = state.color
	}

	startPolling() {
		this.updateState()
		this.poller = setInterval(async () => {
			try {
				this.updateState()
			} catch {}
		}, 30000)
	}

	async setLightState(on, color, duration) {
		const update = {}
		update.on = on

		if (on == "toggle") {
			update.on = !this.state.on
		}

		if (color != null) {
			const newColor = { ...this.state.color }
			if ("bri" in color) {
				newColor.bri = Math.ceil(clamp(color.bri, 0, 100))
			}
			if ("hue" in color || "sat" in color) {
				const hue = Math.ceil(clamp(color.hue ?? 0, 0, 360))
				const sat = Math.ceil(clamp(color.sat ?? 100, 0, 100))

				newColor.hue = hue
				newColor.sat = sat

				delete newColor.kelvin
			}

			if ("kelvin" in color) {
				newColor.kelvin = Math.ceil(color.kelvin)

				delete newColor.hue
				delete newColor.sat
			}

			update.color = newColor
		}

		if (duration != null) {
			update.duration = Math.ceil(duration * 1000)
		}

		if (!update.on) {
			this.light.off(update.duration)
		} else {
			if (!this.state.on) {
				this.light.color(
					update.color.hue ?? 0,
					update.color.sat ?? 0,
					update.color.bri ?? 0,
					update.color.kelvin,
					0
				)
				this.light.on(update.duration)
			} else {
				this.light.color(
					update.color.hue ?? 0,
					update.color.sat ?? 0,
					update.color.bri ?? 0,
					update.color.kelvin,
					update.duration
				)
			}
		}

		this.state.on = update.on
	}
}

class LIFXIoTProvider extends IoTProvider {
	constructor(pluginObj) {
		super("lifx")
		this.pluginObj = pluginObj
		this.client = new Client()

		this.client.on("light-new", async (light) => {
			const [data, hardware] = await Promise.all([
				this._getInitialState(light),
				this._getHardwareData(light),
			])

			const bulb = new LIFXBulb(light, data, hardware)
			this._addNewLight(bulb)
		})
	}

	/**
	 *
	 * @param {import("lifx-lan-client").Light} light
	 */
	_getInitialState(light) {
		return new Promise((resolve, reject) => {
			light.getState((err, data) => {
				if (err) {
					console.error("Error getting hardware data")
					return reject(err)
				}

				resolve(data)
			})
		})
	}

	/**
	 *
	 * @param {import("lifx-lan-client").Light} light
	 */
	_getHardwareData(light) {
		return new Promise((resolve, reject) => {
			light.getHardwareVersion((err, data) => {
				if (err) {
					console.error("Error getting hardware data")
					return reject(err)
				}

				resolve(data)
			})
		})
	}

	async initServices() {
		console.log("Starting LIFX Discovery...")
		this.client.init()
	}

	async loadPlugs() {
		return []
	}

	async loadLights() {
		return []
	}
}

export default {
	name: "lifx",
	uiName: "LIFX Lights",
	icon: "mdi-lightbulb-on-outline",
	color: "#7F743F",
	async init() {
		this.iotProvider = new LIFXIoTProvider(this)
	},
}
