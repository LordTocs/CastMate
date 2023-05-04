import { clamp } from "lodash"
import { Govee, Device } from "@j3lte/govee-lan-controller"
import GoveeCloud from "node-govee-led"
import { IoTProvider, Light, Plug } from "../iot/iot-manager"
import { reactify } from "../state/reactive"
import * as chromatism from "chromatism2"

const API_KEY = "3639a3fb-3e47-4f94-a7c9-beafa2d7f0c8" //Secret? Not Secret? Hello?

/* from docs
"devices": [
    {
        "device": "99:E5:A4:C1:38:29:DA:7B",
        "model": "H6159",
        "deviceName": "test light",
        "controllable": true,
        "retrievable": true,
        "supportCmds": [
            "turn",
            "brightness",
            "color",
            "colorTem"
        ],
        "properties": {
            "colorTem": {
                "range": {
                    "min": 2000,
                    "max": 9000
                }
            }
        }
    },
]
*/

class GoveeBulb extends Light {
	constructor(cloudDesc) {
		super()
		//this.lanDevice = lanDevice

		this.cloudDevice = new GoveeCloud({
			mac: cloudDesc.device,
			model: cloudDesc.model,
			apiKey: API_KEY,
		})

		const id = cloudDesc.device

		this.id = "govee." + id
		this.config = {
			name: cloudDesc.deviceName,
			goveeId: id,
			plugin: "govee",
			type: "bulb",
			rgb: {
				available: cloudDesc.supportCmds?.includes("color") ?? false,
			}, //?????
			kelvin: {
				available:
					cloudDesc.supportCmds?.includes("colorTemp") ?? false,
			}, //????
			dimming: {
				available:
					cloudDesc.supportCmds?.includes("brightness") ?? false,
			}, //????
		}

		if (this.config.kelvin.available) {
			this.config.kelvin.min =
				cloudDesc.properties?.colorTem?.range?.min ?? 2000
			this.config.kelvin.max =
				cloudDesc.properties?.colorTem?.range?.max ?? 6000
		}

		this.state = reactify({
			on: false,
			color: null,
		})

		this.startPolling()
	}

	startPolling() {
		this.poll()
		setInterval(() => this.poll(), 30 * 1000)
	}

	async poll() {
		const state = await this.cloudDevice.getState()

		if (state.properties) {
			;(this.state.on == state.properties.powerState) == "on"

			const bri = this.state.properties.brightness
			const kelvin = this.state.properties.colorTem
			const rgb = this.state.properties.color

			const newColor = {}

			if (rgb != null) {
				const hsv = chromatism.convert(rgb).hsv
				newColor.hue = hsv.h
				newColor.sat = hsv.s
				newColor.bri = hsv.v
			}

			if (kelvin != null) {
				newColor.kelvin = kelvin
			}

			if (bri != null) {
				newColor.bri = bri
			}

			this.state.color = newColor
		}
	}

	async setLightState(on, color, duration) {
		//Sadly no cloud duration support.

		if (on == false) {
			await this.cloudDevice.turnOff()
			this.state.on = false
			return
		}

		if (on == "toggle") {
			if (this.state.on) {
				await this.cloudDevice.turnOff()
				this.state.on = false
				return
			} else if (!this.state.on) {
				await this.cloudDevice.turnOn()
				this.state.on = true
			}
		}

		if (color) {
			if ("hue" in color || "sat" in color) {
				const newColor = { ...this.state.color, ...color }
				delete newColor.kelvin

				const hex = chromatism.convert({
					h: newColor.hue,
					s: newColor.sat,
					v: newColor.bri,
				}).hex
				await this.cloudDevice.setColor(hex)
				this.state.color = newColor
			} else {
				const newColor = { ...this.state.color, ...color }
				if ("kelvin" in color) {
					delete newColor.hue
					delete newColor.sat
					const kelvin = color.kelvin
					if (this.state.kelvin != kelvin) {
						await this.cloudDevice.setColorTemperature(kelvin)
					}
				}
				if ("bri" in color) {
					const bri = color.bri
					if (this.state.bri != bri) {
						await this.cloudDevice.setBrightness(bri)
					}
				}
				this.state.color = newColor
			}
		}
	}
}

class GoveePlug extends Plug {
	constructor(cloudDesc) {
		super()

		this.cloudDevice = new GoveeCloud({
			mac: cloudDesc.device,
			model: cloudDesc.model,
			apiKey: API_KEY,
		})

		const id = cloudDesc.device
		this.id = "govee." + id

		this.config = {
			name: cloudDesc.deviceName,
			goveeId: id,
			plugin: "govee",
		}

		this.state = reactify({
			on: false,
		})

		this.startPolling()
	}

	startPolling() {
		this.poll()
		setInterval(() => this.poll(), 30 * 1000)
	}

	async poll() {
		const state = await this.cloudDevice.getState()

		if (state.properties) {
			;(this.state.on == state.properties.powerState) == "on"
		}
	}

	async setPlugState(on) {
		if (on == "toggle") {
			if (this.state.on) {
				on = false
			} else if (!this.state.on) {
				on = true
			}
		}

		if (on) {
			await this.cloudDevice.turnOn()
		} else {
			await this.cloudDevice.turnOff()
		}
		this.state.on = on
	}
}

class GoveeIoTProvider extends IoTProvider {
	constructor(pluginObj) {
		super("govee")
		this.pluginObj = pluginObj
	}

	startPolling() {
		if (!this.pluginObj.secrets.goveeCloudKey) {
			return
		}

		this.cloudClient = new GoveeCloud({
			apiKey: this.pluginObj.secrets.goveeCloudKey,
			mac: "",
			model: "",
		})

		this.poll()
		this.pollingInterval = setInterval(() => {
			this.poll()
		}, 30 * 1000)
	}

	async poll() {
		const { devices } = await this.cloudClient.getDevices()

		const existingLights = this.lights
		const existingPlugs = this.plugs

		const newDevices = devices.filter((d) => {
			const l = existingLights.find((l) => l.config.goveeId == d.device)
			const p = existingPlugs.find((l) => l.config.goveeId == d.device)
			return p == null && l == null
		})

		const bulbDevices = newDevices.filter(
			(d) =>
				d.supportCmds?.includes("brightness") ||
				d.supportCmds?.includes("color") ||
				d.supportCmds?.includes("colorTem")
		)

		const plugDevices = newDevices.filter(
			(d) =>
				!(
					d.supportCmds?.includes("brightness") ||
					d.supportCmds?.includes("color") ||
					d.supportCmds?.includes("colorTem")
				)
		)

		const bulbs = bulbDevices.map((d) => new GoveeBulb(d))
		const plugs = plugDevices.map((d) => new GoveePlug(d))

		bulbs.map((b) => {
			this._addNewLight(b)
		})
		plugs.map((p) => {
			this._addNewPlug(p)
		})
	}

	async reset() {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval)
		}
		await this.clearResources()
	}

	async secretsChanged() {
		await this.reset()
		this.startPolling()
	}

	async initServices() {
		this.startPolling()
	}

	async loadPlugs() {
		return []
	}

	async loadLights() {
		return []
	}
}

export default {
	name: "govee",
	uiName: "Govee",
	icon: "mdi-lightbulb-on-outline",
	color: "#7F743F",
	async init() {
		this.iotProvider = new GoveeIoTProvider(this)
	},
	async onSecretsReload() {
		this.iotProvider.secretsChanged()
	},
	secrets: {
		goveeCloudKey: { type: String, name: "Govee Cloud API Key" },
	},
}