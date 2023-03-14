import { clamp } from "lodash"
import { Client } from "tplink-smarthome-api"
import { IoTProvider, Light, Plug } from "../iot/iot-manager"
import { reactify } from "../state/reactive"

class TPLinkBulb extends Light {
	constructor(light, lightState) {
		super()
		this.light = light
		this.id = light.id
		this.config = {
			name: light.alias,
			plugin: "tplink",
			rgb: { available: light.supportsColor },
			kelvin: { available: light.supportsColorTemperature },
			dimming: { available: light.supportsBrightness },
		}

		if (light.supportsColorTemperature) {
			const range = light.colorTemperatureRange
			if (range) {
				this.config.kelvin.min = range.min
				this.config.kelvin.max = range.max
			}
		}

		this.state = reactify({
			on: false,
			color: null,
		})

		this.extractState(lightState)

		light.on("lightstate-change", (lightState) => {
			this.extractState(lightState)
		})

		light.startPolling(5000)
	}

	extractState(lightState) {
		this.state.on = lightState.on_off === 1

		const newColor = {}
		if (lightState.brightness != null) {
			newColor.bri = lightState.brightness
		}
		if (lightState.color_temp != null) {
			newColor.kelvin = lightState.color_temp
		} else if (lightState.hue != null) {
			newColor.hue = lightState.hue
			newColor.sat = lightState.saturation ?? 100
		}
	}

	async setLightState(on, color, duration) {
		const update = {
			on_off: on ? 1 : 0,
		}

		if (on == "toggle") {
			const powerState = await light.getPowerState()
			update.on_off = !powerState
		}

		if (color != null) {
			if ("bri" in color) {
				update.brightness = color.bri
			}
			if ("hue" in color || "sat" in color) {
				const hue = clamp(color.hue ?? 0, 0, 360)
				const sat = clamp(color.sat ?? 100, 0, 100)
				update.hue = hue
				update.saturation = sat
			}

			if ("kelvin" in color) {
				update.color_temp = color.kelvin
			}
		}

		if (duration != null) {
			update.transition_period = duration * 1000
		}

		await this.light.setLightState(update)
	}
}

class TPLinkPlug extends Plug {
	constructor(plug, powerState) {
		super()
		this.plug = plug
		this.id = plug.id

		this.config = {
			name: plug.alias,
			plugin: "tplink",
		}

		this.state = reactify({
			on: powerState,
		})

		this.plug.on("power-update", (powerState) => {
			this.state.on = powerState
		})

		this.plug.startPolling(5000)
	}

	async setPlugState(on) {
		if (on === "toggle") {
			await this.plug.togglePowerState()
		} else {
			await this.plug.setPowerState(on)
		}
	}
}

class TPLinkIoTProvider extends IoTProvider {
	constructor(pluginObj) {
		super()
		this.pluginObj = pluginObj
		this.client = new Client({
			/*logger: {
                debug: (...args) => console.log(...args),
                info: (...args) => console.log(...args),
                warn: (...args) => console.log(...args),
                error: (...args) => console.log(...args),
            }*/
		})
		this.client.on("plug-new", async (plug) => {
			console.log("NEW TPLINK PLUG")
			this._addNewPlug(new TPLinkPlug(plug, await plug.getPowerState()))
		})

		this.client.on("bulb-new", async (light) => {
			await light.getInfo()
			this._addNewLight(
				new TPLinkBulb(light, await light.lighting.getLightState())
			)
		})

		this.client.on("error", async (err) => {
			console.error("TP-Link Error", err)
		})
	}

	async initServices() {
		console.log("Starting TP-Link Discovery...")
		this.client.startDiscovery({
			breakoutChildren: true,
		})
	}

	async loadPlugs() {
		return []
	}

	async loadLights() {
		return []
	}
}

export default {
	name: "tplink",
	uiName: "Kasa tp-link",
	icon: "mdi-lightbulb-on-outline",
	color: "#7F743F",
	async init() {
		this.iotProvider = new TPLinkIoTProvider(this)
	},
	ipcMethods: {
		doDiscovery() {},
	},
}
