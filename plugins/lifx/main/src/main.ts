import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	defineSetting,
	removeAllSubResource,
	onSettingChanged,
} from "castmate-core"
import { LightResource, PollingLight } from "castmate-plugin-iot-main/src/light"
import { LightColor } from "castmate-plugin-iot-shared"
import { Toggle } from "castmate-schema"
import EventEmitter from "events"
import { Client, Light } from "lifx-lan-client"

//HACK: The .d.ts file for lifx-lan-client doesn't propery have EventEmitter referenced.
type LIFXClient = Client & EventEmitter

interface LIFXLightState {
	label: string
	power: boolean
	color: {
		hue: number
		saturation: number
		brightness: number
		kelvin: number
	}
}

function getLightState(light: Light) {
	return new Promise<LIFXLightState>((resolve, reject) => {
		light.getState((err: any, data: any) => {
			if (err) {
				return reject(err)
			}

			return resolve(data)
		})
	})
}

interface LIFXHardwareInfo {
	vendorId: number
	vendorName: string
	productId: number
	productName: string
	version: number
	productFeatures: {
		color: boolean
		infrared: boolean
		multizone: boolean
	}
}

function getHardwareInfo(light: Light) {
	return new Promise<LIFXHardwareInfo>((resolve, reject) => {
		light.getHardwareVersion((err: any, data: any) => {
			if (err) {
				return reject(err)
			}
			return resolve(data)
		})
	})
}

class LIFXLight extends PollingLight {
	constructor(private lifxLight: Light) {
		super()

		//@ts-ignore .d.ts is wrong
		this._id = `lifx.${lifxLight.id}`
	}

	async initialize() {
		const [state, hardware] = await Promise.all([getLightState(this.lifxLight), getHardwareInfo(this.lifxLight)])

		this._config = {
			name: state?.label ?? "UNKNOWN",
			provider: "lifx",
			//@ts-ignore .d.ts is wrong
			providerId: this.lifxLight.id,
			rgb: {
				available: hardware.productFeatures.color,
			},
			kelvin: {
				available: true,
				min: 2500,
				max: 9000,
			},
			dimming: {
				available: true,
			},
			transitions: {
				available: true,
			},
		}

		//@ts-ignore
		this.state = {}
		this.parseState(state)

		this.startPolling(30)
	}

	private parseState(lightState: LIFXLightState | undefined) {
		if (!lightState) return

		this.state.on = lightState.power

		if (lightState.color.saturation == 0) {
			this.state.color = `kb(${lightState.color.kelvin}, ${lightState.color.brightness})`
		} else {
			this.state.color = `hsb(${lightState.color.hue}, ${lightState.color.saturation}, ${lightState.color.brightness})`
		}
	}

	async poll() {
		try {
			const lightState = await getLightState(this.lifxLight)
			this.parseState(lightState)
		} catch (err) {
			console.error("Failed LIFX State Update")
		}
	}

	private setPower(power: boolean, duration: number) {
		if (power) {
			this.lifxLight.on(Math.round(duration * 1000), undefined)
		} else {
			this.lifxLight.off(Math.round(duration * 1000), undefined)
		}
	}

	private setColor(color: LightColor, duration: number) {
		const parsedColor = LightColor.parse(color)

		let hue = 0
		let sat = 0
		let bri = parsedColor.bri
		let kelvin = undefined

		if ("hue" in parsedColor) {
			hue = parsedColor.hue
			sat = parsedColor.sat
		} else {
			kelvin = parsedColor.kelvin
		}

		this.lifxLight.color(hue, sat, bri, kelvin, Math.round(duration * 1000), undefined)
	}

	async setLightState(color: LightColor, on: Toggle, transition: number) {
		await this.poll()

		if (on == "toggle") {
			on = !this.state.on
		}

		if (!on) {
			this.setPower(false, transition)
		} else {
			if (!this.state.on) {
				this.setColor(color, 0)
				this.setPower(true, transition)
			} else {
				this.setColor(color, transition)
			}
		}
	}
}

export default definePlugin(
	{
		id: "lifx",
		name: "LIFX",
		description: "UI Description",
		icon: "mdi-pencil",
	},
	() => {
		const subnetMask = defineSetting("subnetMask", {
			type: String,
			required: true,
			name: "LIFX Subnet Mask",
			default: "255.255.255.255",
		})

		let lifxClient: LIFXClient | undefined = undefined

		function initClient() {
			return new Promise<void>((resolve, reject) => {
				lifxClient?.init(
					{
						broadcast: subnetMask.value,
					},
					(err: any, data: any) => {
						console.log("Init Complete")
						if (!err) {
							return reject(err)
						}
						return resolve()
					}
				)
			})
		}

		async function shutdown() {
			if (lifxClient) {
				lifxClient.destroy()
				lifxClient = undefined
			}

			await removeAllSubResource(LIFXLight)
		}

		async function startDiscovery() {
			await shutdown()

			lifxClient = new Client() as LIFXClient

			console.log("Starting LIFX Discovery", subnetMask.value)

			lifxClient.on("light-new", async (light: Light) => {
				const resource = new LIFXLight(light)
				await resource.initialize()
				await LightResource.storage.inject(resource)
			})

			await initClient()
		}

		onLoad(() => {
			startDiscovery()
		})

		onSettingChanged(subnetMask, () => {
			startDiscovery()
		})

		onUnload(() => {
			shutdown()
		})
	}
)
