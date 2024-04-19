import { AxiosInstance } from "axios"
import { LightResource } from "castmate-plugin-iot-main"
import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, defineSetting } from "castmate-core"
import bonjour, { Bonjour, Browser, RemoteService } from "bonjour"
import { PollingLight } from "castmate-plugin-iot-main/src/light"
import axios from "axios"
import { LightColor, LightConfig } from "castmate-plugin-iot-shared"
import { Toggle } from "castmate-schema"

function elgatoToKelvin(value: number) {
	return Math.round((-4100 * value) / 201 + 1993300 / 201)
}

function kelvinToElgato(kelvin: number) {
	return Math.round(((kelvin - 1993300 / 201) * 201) / -4100)
}

class ElgatoKeyLight extends PollingLight {
	private api: AxiosInstance

	constructor(bonjourService: RemoteService) {
		super()

		const ip = bonjourService.referer.address
		const port = bonjourService.port

		this.api = axios.create({
			baseURL: `http://${ip}:${port}/elgato`,
		})

		this._id = `elgato.${bonjourService.txt.id}`
	}

	async initialize() {
		const info = await this.api.get("accessory-info")

		this._config = {
			name: info.data.displayName ?? info.data.productName ?? "Unknown Elgato Device",
			provider: "elgato",
			providerId: this.id,
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
			transitions: {
				available: false,
			},
		}

		//@ts-ignore
		this.state = {}
		await this.poll()

		this.startPolling(30)
	}

	async poll(): Promise<void> {
		const lightState = await this.api.get("lights")

		const state = lightState.data.lights[0]
		this.state.on = !!state.on

		const bri = state.brightness
		const kelvin = elgatoToKelvin(state.temperature)

		this.state.color = `kb(${kelvin}, ${bri})`
	}

	async setLightState(color: LightColor | undefined, on: Toggle, transition: number): Promise<void> {
		await this.poll()

		if (on == "toggle") {
			on = !this.state.on
		}

		const finalColor = color ?? this.state.color
		const parsedColor = LightColor.parse(finalColor)

		if ("hue" in parsedColor) return

		await this.api.put("lights", {
			numberOfLights: 1,
			lights: [
				{
					on,
					brightness: parsedColor.bri,
					temperature: kelvinToElgato(parsedColor.kelvin),
				},
			],
		})

		this.state.on = on
		this.state.color = finalColor
	}
}

interface ElgatoLightStripConfig extends LightConfig {
	ledCount: number
}

class ElgatoLightStrip extends PollingLight<ElgatoLightStripConfig> {
	private api: AxiosInstance

	constructor(bonjourService: RemoteService) {
		super()

		const ip = bonjourService.referer.address
		const port = bonjourService.port

		this.api = axios.create({
			baseURL: `http://${ip}:${port}/elgato`,
		})

		this._id = `elgato.${bonjourService.txt.id}`
	}

	async initialize() {
		const info = await this.api.get("accessory-info")
		const lights = await this.api.get("lights")

		this._config = {
			name: info.data.displayName ?? info.data.productName ?? "Unknown Elgato Device",
			provider: "elgato",
			providerId: this.id,
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
			transitions: {
				available: false,
			},
			ledCount: lights.data.numberOfLights,
		}

		//@ts-ignore
		this.state = {}
		this.parseState(lights.data.lights[0])

		this.startPolling(30)
	}

	private parseState(state: any) {
		this.state.on = state.on

		const bri = state.brightness
		if (state.temperature) {
			const kelvin = elgatoToKelvin(state.temperature)
			this.state.color = `kb(${kelvin}, ${bri})`
		} else {
			this.state.color = `hsb(${state.hue}, ${state.saturation}, ${bri})`
		}
	}

	async poll(): Promise<void> {
		const lightState = await this.api.get("lights")
		const state = lightState.data.lights[0]
		this.parseState(state)
	}

	async setLightState(color: LightColor | undefined, on: Toggle, transition: number): Promise<void> {
		await this.poll()

		if (on == "toggle") {
			on = !this.state.on
		}

		const finalColor = color ?? this.state.color
		const parsedColor = LightColor.parse(finalColor)

		const lightState: Record<string, any> = {
			on,
			brightness: parsedColor.bri,
		}

		if ("hue" in parsedColor) {
			lightState.hue = parsedColor.hue
			lightState.saturation = parsedColor.sat
		} else {
			lightState.temperature = kelvinToElgato(parsedColor.kelvin)
		}

		await this.api.put("lights", {
			numberOfLights: this.config.ledCount,
			lights: new Array(this.config.ledCount).fill(lightState),
		})

		this.parseState(lightState)
	}
}

export default definePlugin(
	{
		id: "elgato",
		name: "UI Name",
		description: "UI Description",
		icon: "mdi-pencil",
	},
	() => {
		let bonjourInstance: Bonjour
		let lightBrowser: Browser

		onLoad(() => {
			bonjourInstance = bonjour()
			setupDiscovery()
		})

		function setupDiscovery() {
			lightBrowser = bonjourInstance.find({ type: "elg" }, async (service) => {
				if (service.txt.md?.includes("Light Strip")) {
					const strip = new ElgatoLightStrip(service)
					await strip.initialize()
					await LightResource.storage.inject(strip)
				} else {
					const keyLight = new ElgatoKeyLight(service)
					await keyLight.initialize()
					await LightResource.storage.inject(keyLight)
				}
			})
		}
	}
)
