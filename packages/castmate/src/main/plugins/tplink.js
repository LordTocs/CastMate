import { clamp } from "lodash"
import { Client } from "tplink-smarthome-api"
import { IoTProvider, Light, Plug } from "../iot/iot-manager"
import { reactify } from "../state/reactive"

class TPLinkBulb extends Light {
	constructor(light, lightState) {
		super()
		/** @type {(import "tplink-smarthome-api").Bulb} */
		this.light = light
		this.id = "tplink." + light.id
		this.config = {
			name: light.alias,
			tplinkId: light.id,
			plugin: "tplink",
			type: "bulb",
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
			ignore_default: true,
		}

		if (on == "toggle") {
			const powerState = await this.light.getPowerState()
			update.on_off = powerState ? 0 : 1
		}

		if (color != null) {
			if ("bri" in color) {
				update.brightness = Math.ceil(clamp(color.bri, 0, 100))
			}
			if ("hue" in color || "sat" in color) {
				const hue = Math.ceil(clamp(color.hue ?? 0, 0, 360))
				const sat = Math.ceil(clamp(color.sat ?? 100, 0, 100))
				update.hue = hue
				update.saturation = sat
				update.color_temp = 0 //Required to disable color temp mode
			} else if ("kelvin" in color) {
				update.hue = 0 //Required to disable color mode
				update.saturation = 0
				update.color_temp = Math.ceil(color.kelvin)
			}
		}

		if (duration != null) {
			update.transition_period = Math.ceil(duration * 1000)
		}

		await this.light.lighting.setLightState(update)
	}
}

class TPLinkPlug extends Plug {
	constructor(plug, powerState) {
		super()
		this.plug = plug
		this.id = "tplink." + plug.id

		this.config = {
			tplinkId: plug.id,
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
		super("tplink")
		this.pluginObj = pluginObj
		this.client = new Client({
			/*logger: {
				debug: (...args) => console.log(...args),
				info: (...args) => console.log(...args),
				warn: (...args) => console.log(...args),
				error: (...args) => console.log(...args),
			},*/
		})

		this.client.on("plug-new", async (plug) => {
			this._addNewPlug(new TPLinkPlug(plug, await plug.getPowerState()))
		})

		this.client.on("bulb-new", async (light) => {
			this._addNewLight(
				new TPLinkBulb(light, await light.lighting.getLightState())
			)
		})

		this.client.on("error", async (err) => {
			console.error("TP-Link Error", err)
		})
	}

	async initServices() {
		const broadcast =
			this.pluginObj.settings.broadcastMask ?? "255.255.255.255"
		console.log("Starting TP-Link Discovery", broadcast)
		this.client.startDiscovery({
			breakoutChildren: true,
			broadcast,
		})
	}

	async setBroadcastMask(newMask) {
		this.client.stopDiscovery()
		console.log("Starting TP-Link Discovery", newMask)
		this.client.startDiscovery({
			broadcast: newMask,
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
	settings: {
		broadcastMask: { type: String, name: "Broadcast Mask" },
	},
	async onSettingsReload() {
		this.iotProvider.setBroadcastMask(this.settings.broadcastMask)
	},
}
