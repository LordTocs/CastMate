import { LightService } from "castmate-plugin-iot-main"
import bonjour, { Bonjour, Browser, RemoteService } from "bonjour"

import { LightColor, LightConfig, LightState } from "castmate-plugin-iot-shared"
import { usePollingLightProvider } from "castmate-plugin-iot-main"

function elgatoToKelvin(value: number) {
	return Math.round((-4100 * value) / 201 + 1993300 / 201)
}

function kelvinToElgato(kelvin: number) {
	return Math.round(((kelvin - 1993300 / 201) * 201) / -4100)
}

interface ElgatoLightData {
	ip: string
	port: number
}

interface ElgatoAccessoryInfo {
	productName: string
	hardwareBoardType: number
	firmwareBuildNumber: number
	firmwareVersion: string
	serialNumber: string
	displayName: string
	features: string[]
}

interface ElgatoLightColor {
	on: number
	temperature?: number
	brightness: number
	hue?: number
	saturation?: number
}

interface ElgatoLightsResp {
	numberOfLights: number
	lights: ElgatoLightColor[]
}

async function apiCall<Resp>(light: ElgatoLightData, path: string, method: string = "GET", body?: any = undefined) {
	const resp = await fetch(`http://${light.ip}:${light.port}/elgato/${path}`, {
		method,
		body: body == null ? undefined : JSON.stringify(body),
	})

	if (!resp.ok) {
		const respText = await resp.text().catch(() => "")
		throw new Error(`${resp.status} ${resp.statusText}: ${respText}`)
	}

	const data = (await resp.json()) as Resp
	return data
}

function parseElgatoLightColor(elgatoColor: ElgatoLightColor): LightColor {
	const bri = elgatoColor.brightness
	if (elgatoColor.temperature != null) {
		const kelvin = elgatoToKelvin(elgatoColor.temperature)
		return `kb(${kelvin}, ${bri})`
	} else if (elgatoColor.hue != null && elgatoColor.saturation != null) {
		return `hsb(${elgatoColor.hue}, ${elgatoColor.saturation}, ${bri})`
	}
	throw new Error(`Unparsable Elgato Color: ${JSON.stringify(elgatoColor)}`)
}

usePollingLightProvider<ElgatoLightData>(() => {
	let bonjourInstance: Bonjour | undefined
	let lightBrowser: Browser | undefined

	return {
		id: "elgato",
		async initialize() {
			bonjourInstance = bonjour()

			lightBrowser = bonjourInstance.find({ type: "elg" }, async (service) => {
				const id = service.txt.id
				const ip = service.referer.address
				const port = service.referer.port

				const data: ElgatoLightData = {
					ip,
					port,
				}

				const info = await apiCall<ElgatoAccessoryInfo>(data, "accessory-info")
				const lights = await apiCall<ElgatoLightsResp>(data, "lights")

				const name = info.displayName ?? info.productName ?? "Unknown Elgato Device"

				const isStrip = service.txt.md?.includes("Light Strip") ?? false

				const initialConfig: LightConfig = {
					provider: "elgato",
					providerId: id,
					rgb: {
						available: isStrip,
					},
					kelvin: {
						available: true,
						range: {
							min: elgatoToKelvin(143),
							max: elgatoToKelvin(344),
						},
					},
					dimming: {
						available: true,
					},
					transitions: {
						available: false,
					},
				}

				const initialState: LightState = {
					on: lights.lights[0].on != 0,
					color: parseElgatoLightColor(lights.lights[0]),
				}

				await LightService.getInstance().provideLight(this, data, name, initialState, initialConfig)
			})
		},
		async uninitialize() {
			lightBrowser?.stop()
			bonjourInstance?.destroy()
			lightBrowser = undefined
			bonjourInstance = undefined
		},
		async setLightState(light, data, color, on, transition) {
			//await this.poll()

			if (on == "toggle") {
				on = !light.state.on
			}

			const finalColor = color ?? light.state.color
			const parsedColor = LightColor.parse(finalColor)

			const isRGB = "hue" in parsedColor

			if (isRGB && !light.config.rgb.available) return

			await apiCall(data, "lights", "PUT", {
				numberOfLights: 1,
				lights: [
					{
						on,
						brightness: parsedColor.bri,
						temperature: kelvinToElgato(parsedColor.bri),
					},
				],
			})

			light.state.on = on
			light.state.color = finalColor
		},
		async pollLight(light, data) {
			const lightState = await apiCall<ElgatoLightsResp>(data, "lights")

			const state = lightState.lights[0]
			light.state.on = !!state.on

			light.state.color = parseElgatoLightColor(state)
		},
	}
})

// class ElgatoKeyLight extends PollingLight {
// 	private api: AxiosInstance

// 	constructor(bonjourService: RemoteService) {
// 		super()

// 		const ip = bonjourService.referer.address
// 		const port = bonjourService.port

// 		this.api = axios.create({
// 			baseURL: `http://${ip}:${port}/elgato`,
// 			timeout: 2000,
// 		})

// 		this._id = `elgato.${bonjourService.txt.id}`
// 	}

// 	async initialize() {
// 		const info = await this.api.get("accessory-info")

// 		this._config = {
// 			name: info.data.displayName ?? info.data.productName ?? "Unknown Elgato Device",
// 			provider: "elgato",
// 			providerId: this.id,
// 			rgb: {
// 				available: false,
// 			},
// 			kelvin: {
// 				available: true,
// 				min: elgatoToKelvin(143),
// 				max: elgatoToKelvin(344),
// 			},
// 			dimming: {
// 				available: true,
// 			},
// 			transitions: {
// 				available: false,
// 			},
// 		}

// 		//@ts-ignore
// 		this.state = {}
// 		await this.poll()

// 		this.startPolling(30)
// 	}

// 	async poll(): Promise<void> {
// 		const lightState = await this.api.get("lights")

// 		const state = lightState.data.lights[0]
// 		this.state.on = !!state.on

// 		const bri = state.brightness
// 		const kelvin = elgatoToKelvin(state.temperature)

// 		this.state.color = `kb(${kelvin}, ${bri})`
// 	}

// 	async setLightState(color: LightColor | undefined, on: Toggle, transition: number): Promise<void> {
// 		await this.poll()

// 		if (on == "toggle") {
// 			on = !this.state.on
// 		}

// 		const finalColor = color ?? this.state.color
// 		const parsedColor = LightColor.parse(finalColor)

// 		if ("hue" in parsedColor) return

// 		await this.api.put("lights", {
// 			numberOfLights: 1,
// 			lights: [
// 				{
// 					on,
// 					brightness: parsedColor.bri,
// 					temperature: kelvinToElgato(parsedColor.kelvin),
// 				},
// 			],
// 		})

// 		this.state.on = on
// 		this.state.color = finalColor
// 	}
// }

// interface ElgatoLightStripConfig extends LightConfig {
// 	ledCount: number
// }

// class ElgatoLightStrip extends PollingLight<ElgatoLightStripConfig> {
// 	private api: AxiosInstance

// 	constructor(bonjourService: RemoteService) {
// 		super()

// 		const ip = bonjourService.referer.address
// 		const port = bonjourService.port

// 		this.api = axios.create({
// 			baseURL: `http://${ip}:${port}/elgato`,
// 			timeout: 2000,
// 		})

// 		this._id = `elgato.${bonjourService.txt.id}`
// 	}

// 	async initialize() {
// 		const info = await this.api.get("accessory-info")
// 		const lights = await this.api.get("lights")

// 		this._config = {
// 			name: info.data.displayName ?? info.data.productName ?? "Unknown Elgato Device",
// 			provider: "elgato",
// 			providerId: this.id,
// 			rgb: {
// 				available: true,
// 			},
// 			kelvin: {
// 				available: true,
// 				min: elgatoToKelvin(143),
// 				max: elgatoToKelvin(344),
// 			},
// 			dimming: {
// 				available: true,
// 			},
// 			transitions: {
// 				available: false,
// 			},
// 			ledCount: lights.data.numberOfLights,
// 		}

// 		//@ts-ignore
// 		this.state = {}
// 		this.parseState(lights.data.lights[0])

// 		this.startPolling(30)
// 	}

// 	private parseState(state: any) {
// 		this.state.on = state.on

// 		const bri = state.brightness
// 		if (state.temperature) {
// 			const kelvin = elgatoToKelvin(state.temperature)
// 			this.state.color = `kb(${kelvin}, ${bri})`
// 		} else {
// 			this.state.color = `hsb(${state.hue}, ${state.saturation}, ${bri})`
// 		}
// 	}

// 	async poll(): Promise<void> {
// 		const lightState = await this.api.get("lights")
// 		const state = lightState.data.lights[0]
// 		this.parseState(state)
// 	}

// 	async setLightState(color: LightColor | undefined, on: Toggle, transition: number): Promise<void> {
// 		await this.poll()

// 		if (on == "toggle") {
// 			on = !this.state.on
// 		}

// 		const finalColor = color ?? this.state.color
// 		const parsedColor = LightColor.parse(finalColor)

// 		const lightState: Record<string, any> = {
// 			on,
// 			brightness: parsedColor.bri,
// 		}

// 		if ("hue" in parsedColor) {
// 			lightState.hue = parsedColor.hue
// 			lightState.saturation = parsedColor.sat
// 		} else {
// 			lightState.temperature = kelvinToElgato(parsedColor.kelvin)
// 		}

// 		await this.api.put("lights", {
// 			numberOfLights: this.config.ledCount,
// 			lights: new Array(this.config.ledCount).fill(lightState),
// 		})

// 		this.parseState(lightState)
// 	}
// }

// export default definePlugin(
// 	{
// 		id: "elgato",
// 		name: "UI Name",
// 		description: "UI Description",
// 		icon: "mdi-pencil",
// 	},
// 	() => {
// 		let bonjourInstance: Bonjour
// 		let lightBrowser: Browser

// 		onLoad(() => {
// 			bonjourInstance = bonjour()
// 			setupDiscovery()
// 		})

// 		function setupDiscovery() {
// 			lightBrowser = bonjourInstance.find({ type: "elg" }, async (service) => {
// 				if (service.txt.md?.includes("Light Strip")) {
// 					const strip = new ElgatoLightStrip(service)
// 					await strip.initialize()
// 					await LightResource.storage.inject(strip)
// 				} else {
// 					const keyLight = new ElgatoKeyLight(service)
// 					await keyLight.initialize()
// 					await LightResource.storage.inject(keyLight)
// 				}
// 			})
// 		}
// 	}
// )
