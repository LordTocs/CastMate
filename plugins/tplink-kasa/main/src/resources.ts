import {
	ReactiveRef,
	onAccountAuth,
	onLoad,
	onSettingChanged,
	removeAllSubResource,
	usePluginLogger,
} from "castmate-core"
import { LightResource, PlugResource, PollingPlug } from "castmate-plugin-iot-main"
import { LightColor } from "castmate-plugin-iot-shared"
import { Toggle } from "castmate-schema"
import _clamp from "lodash/clamp"

import { createKasaDiscoverer, KasaDiscoverer } from "./discovery/base-discovery"

import assert from "node:assert"
import { KasaAccount } from "./accounts/kasa-account"
import { extractKasaRelayState, getKasaSysInfo, KasaDevice, setKasaRelayState } from "./lan-api"

// class KasaLight extends LightResource {
// 	constructor(private kasaBulb: Bulb, initialState: LightState) {
// 		super()

// 		this._id = `kasa.${kasaBulb.id}`

// 		this._config = {
// 			name: kasaBulb.name,
// 			provider: "kasa",
// 			providerId: kasaBulb.id,
// 			rgb: {
// 				available: kasaBulb.supportsColor,
// 			},
// 			kelvin: {
// 				available: kasaBulb.supportsColorTemperature,
// 			},
// 			dimming: {
// 				available: kasaBulb.supportsBrightness,
// 			},
// 			transitions: {
// 				available: true,
// 			},
// 		}

// 		if (kasaBulb.supportsColorTemperature) {
// 			this._config.kelvin.max = kasaBulb.colorTemperatureRange?.max
// 			this._config.kelvin.min = kasaBulb.colorTemperatureRange?.min
// 		}

// 		//@ts-ignore
// 		this.state = {}
// 		this.parseLightState(initialState)

// 		kasaBulb.on("lightstate-change", (lightState) => {
// 			this.parseLightState(lightState)
// 		})

// 		//kasaBulb.(30000)
// 	}

// 	private parseLightState(state: LightState) {
// 		this.state.on = state.on_off == 1

// 		const brightness = state.brightness ?? 100
// 		if (state.color_temp) {
// 			this.state.color = `kb(${state.color_temp}, ${brightness})`
// 		} else if (state.hue && state.saturation) {
// 			this.state.color = `hsb(${state.hue}, ${state.saturation}, ${brightness})`
// 		}
// 	}

// 	async setLightState(color: LightColor | undefined, on: Toggle, transition: number): Promise<void> {
// 		if (on == "toggle") {
// 			const powerState = await this.kasaBulb.getPowerState()
// 			on = !powerState
// 		}

// 		const update: LightStateInput = {
// 			on_off: on ? 1 : 0,
// 		}

// 		if (color) {
// 			const parsedColor = LightColor.parse(color)

// 			update.brightness = parsedColor.bri
// 			if ("kelvin" in parsedColor) {
// 				update.color_temp = Math.ceil(parsedColor.kelvin)
// 				update.hue = 0
// 				update.saturation = 0
// 			} else {
// 				update.hue = Math.floor(parsedColor.hue)
// 				update.saturation = Math.ceil(parsedColor.sat)
// 				update.color_temp = 0
// 			}
// 		}

// 		update.transition_period = Math.round(transition * 1000)

// 		await this.kasaBulb.lighting.setLightState(update)
// 	}
// }

class KasaPlug extends PollingPlug {
	constructor(private kasaPlug: KasaDevice) {
		super()

		this._id = `kasa.${kasaPlug.id}`

		this._config = {
			name: kasaPlug.sysInfo?.alias ?? "UNKNOWN DEVICE",
			provider: "kasa",
			providerId: kasaPlug.id,
		}

		this.state = {
			on: kasaPlug.sysInfo ? extractKasaRelayState(kasaPlug.sysInfo) : false,
		}
	}

	async poll(): Promise<void> {
		await this.updateState()
	}

	private async updateState() {
		const sysInfo = await getKasaSysInfo(this.kasaPlug)
		this.state.on = extractKasaRelayState(sysInfo)
	}

	async setPlugState(on: Toggle): Promise<void> {
		if (on == "toggle") {
			await this.updateState()
			on = !this.state.on
		}

		await setKasaRelayState(this.kasaPlug, on)

		await this.updateState()
	}
}

const logger = usePluginLogger("tplink-kasa")

export function setupLights(subnetMask: ReactiveRef<string>) {
	let client: KasaDiscoverer | undefined

	async function clearResources() {
		await removeAllSubResource(KasaPlug)
		//await removeAllSubResource(KasaLight)
	}

	async function setupClient() {
		try {
			client = await createKasaDiscoverer(subnetMask.value)

			client.on("device-discovered", (device) => {
				//if (device.deviceType == "plug or something")
				logger.log("Kasa Device Discovered!", device.id)
				const plug = new KasaPlug(device)
				KasaPlug.storage.inject(plug)
			})
		} catch (err) {
			logger.log("ERROR CREATING DISCOVERER!", err)
		}
	}

	async function setupDiscovery() {
		assert(client)
		client.startDiscovery()
	}

	async function rediscoverLights() {
		client?.close()
		await clearResources()
		await setupClient()
		await setupDiscovery()
	}

	onAccountAuth(KasaAccount, "main", async (account) => {
		await rediscoverLights()
	})

	onLoad(async () => {
		//Start discovery for non-authed lights, skip if we're authenticated since onAccountAuth will have already kicked it off
		if (!KasaAccount.main.isAuthenticated) {
			await rediscoverLights()
		}
	})

	onSettingChanged(subnetMask, async () => {
		await rediscoverLights()
	})
}
