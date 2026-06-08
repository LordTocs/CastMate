import { onLoad, onUnload, definePlugin, defineSetting, onSettingChanged, usePluginLogger } from "castmate-core"
import { useLightProvider, LightService } from "castmate-plugin-iot-main"
import { usePollingLightProvider } from "castmate-plugin-iot-main/src/light"
import { LightColor, LightConfig, LightState } from "castmate-plugin-iot-shared"
import EventEmitter from "events"
import { Client, Light } from "lifx-lan-client"

const logger = usePluginLogger("lifx")

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

function getLifxLightState(light: Light) {
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

function parseState(lightState: LIFXLightState | undefined): LightState | undefined {
	if (!lightState) return undefined

	const on: boolean = lightState.power
	let color: LightColor

	if (lightState.color.saturation == 0) {
		color = `kb(${lightState.color.kelvin}, ${lightState.color.brightness})`
	} else {
		color = `hsb(${lightState.color.hue}, ${lightState.color.saturation}, ${lightState.color.brightness})`
	}

	return {
		on,
		color,
	}
}

function setPower(lifxLight: Light, power: boolean, duration: number) {
	if (power) {
		lifxLight.on(Math.round(duration * 1000), undefined)
	} else {
		lifxLight.off(Math.round(duration * 1000), undefined)
	}
}

function setColor(lifxLight: Light, color: LightColor, duration: number) {
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

	lifxLight.color(hue, sat, bri, kelvin, Math.round(duration * 1000), undefined)
}

interface LIFXLight {
	light: Light
}

usePollingLightProvider<LIFXLight>(() => {
	let client: LIFXClient | undefined = undefined

	function initClient() {
		return new Promise<void>((resolve, reject) => {
			client?.init(
				{
					broadcast: "255.255.255.255",
					startDiscovery: false,
				},
				(err: any, data: any) => {
					if (err) {
						return reject(err)
					}
					return resolve()
				}
			)
		})
	}

	return {
		id: "lifx",
		async initialize() {
			client = new Client() as LIFXClient

			client?.on("light-new", async (light: Light) => {
				const lifxLight: LIFXLight = {
					light,
				}

				const [state, hardware] = await Promise.all([getLifxLightState(light), getHardwareInfo(light)])

				//@ts-expect-error The .d.ts is wrong
				const id: string = light.id

				const initialConfig: LightConfig = {
					provider: "lifx",
					providerId: id,
					rgb: {
						available: hardware.productFeatures?.color ?? true,
					},
					kelvin: {
						available: true,
						range: { min: 2500, max: 9000 },
					},
					dimming: {
						available: true,
					},
					transitions: {
						available: true,
					},
				}

				const initialState = parseState(state) ?? {
					on: false,
					color: LightColor.factoryCreate(),
				}

				const name = state?.label ?? "UNKNOWN"

				LightService.getInstance().provideLight(this, lifxLight, name, initialState, initialConfig)
			})

			await initClient()
		},
		async uninitialize() {},
		async setLightState(light, data, color, on, transition) {
			//TODO: do poll here

			if (on == "toggle") {
				on = !light.state.on
			}

			if (!on) {
				setPower(data.light, false, transition)
			} else {
				if (!light.state.on) {
					if (color) setColor(data.light, color, 0)
					setPower(data.light, true, transition)
				} else {
					if (color) setColor(data.light, color, transition)
				}
			}
		},

		async pollLights() {
			//I don't think this actually does a poll...
			client?.startDiscovery([])
		},

		async pollLight(light, data) {
			try {
				const lifxState = await getLifxLightState(data.light)
				const lightState = parseState(lifxState)
				if (lightState) {
					light.state = lightState
				}
			} catch (err) {
				logger.error("Failed LIFX State Update")
			}
		},
	}
})

// class LIFXLight extends PollingLight {
// 	constructor(private lifxLight: Light) {
// 		super()

// 		//@ts-ignore .d.ts is wrong
// 		this._id = `lifx.${lifxLight.id}`
// 	}

// 	async initialize() {
// 		const [state, hardware] = await Promise.all([getLifxLightState(this.lifxLight), getHardwareInfo(this.lifxLight)])

// 		this._config = {
// 			name: state?.label ?? "UNKNOWN",
// 			provider: "lifx",
// 			//@ts-ignore .d.ts is wrong
// 			providerId: this.lifxLight.id,
// 			rgb: {
// 				available: hardware.productFeatures?.color ?? true,
// 			},
// 			kelvin: {
// 				available: true,
// 				min: 2500,
// 				max: 9000,
// 			},
// 			dimming: {
// 				available: true,
// 			},
// 			transitions: {
// 				available: true,
// 			},
// 		}

// 		//@ts-ignore
// 		this.state = {}
// 		this.parseState(state)

// 		this.startPolling(30)
// 	}

// 	private parseState(lightState: LIFXLightState | undefined) {
// 		if (!lightState) return

// 		this.state.on = lightState.power

// 		if (lightState.color.saturation == 0) {
// 			this.state.color = `kb(${lightState.color.kelvin}, ${lightState.color.brightness})`
// 		} else {
// 			this.state.color = `hsb(${lightState.color.hue}, ${lightState.color.saturation}, ${lightState.color.brightness})`
// 		}
// 	}

// 	async poll() {
// 		try {
// 			const lightState = await getLifxLightState(this.lifxLight)
// 			this.parseState(lightState)
// 		} catch (err) {
// 			logger.error("Failed LIFX State Update")
// 		}
// 	}

// 	private setPower(power: boolean, duration: number) {
// 		if (power) {
// 			this.lifxLight.on(Math.round(duration * 1000), undefined)
// 		} else {
// 			this.lifxLight.off(Math.round(duration * 1000), undefined)
// 		}
// 	}

// 	private setColor(color: LightColor, duration: number) {
// 		const parsedColor = LightColor.parse(color)

// 		let hue = 0
// 		let sat = 0
// 		let bri = parsedColor.bri
// 		let kelvin = undefined

// 		if ("hue" in parsedColor) {
// 			hue = parsedColor.hue
// 			sat = parsedColor.sat
// 		} else {
// 			kelvin = parsedColor.kelvin
// 		}

// 		this.lifxLight.color(hue, sat, bri, kelvin, Math.round(duration * 1000), undefined)
// 	}

// 	async setLightState(color: LightColor | undefined, on: Toggle, transition: number) {
// 		await this.poll()

// 		if (on == "toggle") {
// 			on = !this.state.on
// 		}

// 		if (!on) {
// 			this.setPower(false, transition)
// 		} else {
// 			if (!this.state.on) {
// 				if (color) this.setColor(color, 0)
// 				this.setPower(true, transition)
// 			} else {
// 				if (color) this.setColor(color, transition)
// 			}
// 		}
// 	}
// }

export default definePlugin(
	{
		id: "lifx",
		name: "LIFX",
		icon: "iot iot-lifx",
		color: "#7F743F",
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
						if (err) {
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

			logger.log("Starting LIFX Discovery", subnetMask.value)

			lifxClient.on("light-new", async (light: Light) => {
				const resource = new LIFXLight(light)
				await resource.initialize()
				await LightResource.storage.inject(resource)
			})

			lifxClient.on("error", (err) => {
				logger.error("LIFX Error", err)
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
