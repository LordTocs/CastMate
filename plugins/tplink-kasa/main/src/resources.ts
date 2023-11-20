import { ReactiveRef, onLoad, onSettingChanged, removeAllSubResource } from "castmate-core"
import { LightResource, PlugResource } from "castmate-plugin-iot-main"
import { LightColor } from "castmate-plugin-iot-shared"
import { Toggle } from "castmate-schema"
import _clamp from "lodash/clamp"

import { Client, Plug, LightState, LightStateInput, Bulb } from "tplink-smarthome-api"

class KasaLight extends LightResource {
	constructor(private kasaBulb: Bulb, initialState: LightState) {
		super()

		this._id = `kasa.${kasaBulb.id}`

		this._config = {
			name: kasaBulb.name,
			provider: "kasa",
			providerId: kasaBulb.id,
			rgb: {
				available: kasaBulb.supportsColor,
			},
			kelvin: {
				available: kasaBulb.supportsColorTemperature,
			},
			dimming: {
				available: kasaBulb.supportsBrightness,
			},
			transitions: {
				available: true,
			},
		}

		if (kasaBulb.supportsColorTemperature) {
			this._config.kelvin.max = kasaBulb.colorTemperatureRange?.max
			this._config.kelvin.min = kasaBulb.colorTemperatureRange?.min
		}

		//@ts-ignore
		this.state = {}
		this.parseLightState(initialState)

		kasaBulb.on("lightstate-change", (lightState) => {
			this.parseLightState(lightState)
		})

		kasaBulb.startPolling(30000)
	}

	private parseLightState(state: LightState) {
		this.state.on = state.on_off == 1

		const brightness = state.brightness ?? 100
		if (state.color_temp) {
			this.state.color = `kb(${state.color_temp}, ${brightness})`
		} else if (state.hue && state.saturation) {
			this.state.color = `hsb(${state.hue}, ${state.saturation}, ${brightness})`
		}
	}

	async setLightState(color: LightColor, on: Toggle, transition: number): Promise<void> {
		if (on == "toggle") {
			const powerState = await this.kasaBulb.getPowerState()
			on = !powerState
		}

		const parsedColor = LightColor.parse(color)

		const update: LightStateInput = {
			on_off: on ? 1 : 0,
		}

		update.brightness = parsedColor.bri
		if ("kelvin" in parsedColor) {
			update.color_temp = Math.ceil(parsedColor.kelvin)
			update.hue = 0
			update.saturation = 0
		} else {
			update.hue = Math.floor(parsedColor.hue)
			update.saturation = Math.ceil(parsedColor.sat)
			update.color_temp = 0
		}

		update.transition_period = Math.round(transition * 1000)

		await this.kasaBulb.lighting.setLightState(update)
	}
}

class KasaPlug extends PlugResource {
	constructor(private kasaPlug: Plug, initialPower: boolean) {
		super()

		this._id = `kasa.${kasaPlug.id}`

		this._config = {
			name: kasaPlug.name,
			provider: "kasa",
			providerId: kasaPlug.id,
		}

		this.state = {
			on: initialPower,
		}

		kasaPlug.on("power-update", (powerState: boolean) => {
			this.state.on = powerState
		})

		//TODO: Why is this deprecated?
		kasaPlug.startPolling(30000)
	}

	private async updateState() {
		this.state.on = await this.kasaPlug.getPowerState()
	}

	async setPlugState(on: Toggle): Promise<void> {
		if (on == "toggle") {
			await this.kasaPlug.togglePowerState()
		} else {
			await this.kasaPlug.setPowerState(on)
		}

		await this.updateState()
	}
}

export function setupLights(subnetMask: ReactiveRef<string>) {
	let client: Client

	async function clearResources() {
		await removeAllSubResource(KasaPlug)
		await removeAllSubResource(KasaLight)
	}

	function setupClient() {
		client = new Client()

		client.on("plug-new", async (plug: Plug) => {
			console.log("New TPLINK Plug!")
			const powerState = await plug.getPowerState()
			const resource = new KasaPlug(plug, powerState)

			PlugResource.storage.inject(resource)
		})

		client.on("bulb-new", async (bulb: Bulb) => {
			const lightState = await bulb.lighting.getLightState()
			const resource = new KasaLight(bulb, lightState)

			LightResource.storage.inject(resource)
		})

		client.on("error", async (err) => {
			console.error("TP-Link Kasa Error", err)
		})

		client.on("discover-invalid", (err) => {
			console.error("Kasa Discovery Invalid?", err)
		})
	}

	async function setupDiscovery() {
		console.log("Starting TP-Link Kasa Discovery", subnetMask.value)
		client.startDiscovery({
			breakoutChildren: true,
			broadcast: subnetMask.value.trim(),
		})
	}

	onLoad(() => {
		setupClient()
		setupDiscovery()
	})

	onSettingChanged(subnetMask, async () => {
		client.stopDiscovery()
		await clearResources()
		setupClient()
		setupDiscovery()
	})
}
