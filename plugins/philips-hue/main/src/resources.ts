import { LightResource, PlugResource, defineIoTProvider } from "castmate-plugin-iot-main"

import { ReactiveRef, iterSubResource, onLoad, onSettingChanged, removeAllSubResource } from "castmate-core"
import { Toggle } from "castmate-schema"
import axios, { Method } from "axios"
import https from "https"
import { LightColor, LightConfig } from "castmate-plugin-iot-shared"
import _clamp from "lodash/clamp"
import * as chromatism from "chromatism2"
import { HUEApiGroupedLight, HUEApiLight, HUEApiLightState, HUEApiLightUpdate, HUEApiRoom } from "./api"

interface HubInfo {
	readonly hubIp: string
	readonly hubKey: string
}

async function hubRequest(hubInfo: HubInfo, method: Method, url: string, data?: object) {
	return await axios.request({
		baseURL: `https://${hubInfo.hubIp}/clip/v2`,
		headers: {
			"hue-application-key": hubInfo.hubKey,
		},
		httpsAgent: new https.Agent({
			rejectUnauthorized: false,
		}),
		url,
		method,
		data,
	})
}

function xyToHueSat({ x, y }: { x: number; y: number }) {
	const z = 1.0 - x - y

	const Y = 100
	const X = (Y / y) * x
	const Z = (Y / y) * z

	const hsv = chromatism.convert({ X, Y, Z }).hsv

	return { hue: hsv.h, sat: hsv.s }
}

function mirekToKelvin(mirek: number | undefined) {
	if (mirek == null) return undefined

	return 1000000 / mirek
}

function kelvinToMirek(kelvin: number) {
	return kelvin * 1000000
}

export class PhilipsHUELight extends LightResource {
	constructor(lightInfo: HUEApiLight, private hubInfo: HubInfo) {
		super()

		this._id = `philips-hue.${lightInfo.id}`

		this._config = {
			name: lightInfo.metadata.name,
			provider: "philips-hue",
			providerId: lightInfo.id,
			rgb: {
				available: !!lightInfo.color,
			},
			kelvin: {
				available: !!lightInfo.color_temperature,
				min: mirekToKelvin(lightInfo.color_temperature?.mirek_schema?.mirek_minimum),
				max: mirekToKelvin(lightInfo.color_temperature?.mirek_schema?.mirek_maximum),
			},
			dimming: {
				available: !!lightInfo.dimming,
			},
			transitions: {
				available: true,
			},
		}

		//@ts-ignore
		this.state = {}
		this.parseApiState(lightInfo)
	}

	parseApiState(apiState: HUEApiLightState) {
		const brightness = apiState.dimming?.brightness ?? 100

		if (apiState.color_temperature?.mirek != null) {
			this.state.color = `kb(${kelvinToMirek(apiState.color_temperature.mirek)}, ${brightness})`
		} else if (apiState.color?.xy != null) {
			const hueSat = xyToHueSat(apiState.color.xy)
			this.state.color = `hsb(${hueSat.hue}, ${hueSat.sat}, ${brightness})`
		}

		this.state.on = apiState.on?.on ?? false
	}

	async setLightState(color: LightColor, on: Toggle, transition: number): Promise<void> {
		const parsedColor = LightColor.parse(color)

		if (on == "toggle") {
			on = !this.state.on
		}

		const update: HUEApiLightUpdate = {
			on: {
				on,
			},
			dimming: {
				brightness: _clamp(Number(parsedColor.bri), 0, 100),
			},
			dynamics: {
				duration: Math.round(transition * 1000),
			},
		}

		if ("hue" in parsedColor) {
			const hue = _clamp(parsedColor.hue ?? 0, 0, 360)
			const sat = _clamp(parsedColor.sat ?? 100, 0, 100)
			const bri = _clamp(parsedColor.bri ?? 100, 0, 100)
			const cie = chromatism.convert({ h: hue, s: sat, v: bri }).xyY
			update.color = {
				xy: {
					x: cie.x,
					y: cie.y,
				},
			}
		} else {
			update.color_temperature = {
				mirek: Math.round(1000000 / parsedColor.kelvin),
			}
		}

		await hubRequest(this.hubInfo, "put", `/resource/light/${this.config.providerId}`, update)
	}
}

interface PhilipsHUEGroupConfig extends LightConfig {
	roomId: string
	lightIds: string[]
}

export class PhilipsHUEGroup extends LightResource<PhilipsHUEGroupConfig> {
	childDeviceIds: string[] = []
	constructor(roomInfo: HUEApiRoom, private hubInfo: HubInfo) {
		super()

		const group = roomInfo.services.find((s) => s.rtype == "grouped_light")
		if (!group) throw new Error("Room without a group!")

		this._id = `philips-hue.${group.rid}`

		this.childDeviceIds = roomInfo.children.filter((c) => c.rtype == "device").map((c) => c.rid)

		this._config = {
			name: roomInfo.metadata.name,
			provider: "philips-hue",
			providerId: group.rid,
			lightIds: [],
			roomId: roomInfo.id,
			rgb: {
				available: true,
			},
			kelvin: {
				available: true,
			},
			transitions: {
				available: true,
			},
			dimming: {
				available: true,
			},
		}

		//@ts-ignore
		this.state = {}
	}

	async initialize() {
		const groupResp = await hubRequest(this.hubInfo, "get", `/resource/grouped_light/${this.config.providerId}`)
		const groupInfo = groupResp.data.data as HUEApiGroupedLight[]
		this.parseApiState(groupInfo[0])

		const deviceResps = await Promise.all(
			this.childDeviceIds.map((id) => hubRequest(this.hubInfo, "get", `resource/device/${id}`))
		)

		const lightIds = deviceResps.map((r) => r.data.data[0].services.find((s: any) => s.rtype == "light")?.rid) as (
			| string
			| undefined
		)[]

		await this.applyConfig({
			lightIds: lightIds.filter((id) => id != null) as string[],
		})

		//console.log(deviceResps.map((r) => r.data.data[0].services))
	}

	parseApiState(apiState: HUEApiLightState) {
		const brightness = apiState.dimming?.brightness ?? 100

		if (apiState.color_temperature?.mirek != null) {
			this.state.color = `kb(${kelvinToMirek(apiState.color_temperature.mirek)}, ${brightness})`
		} else if (apiState.color?.xy != null) {
			const hueSat = xyToHueSat(apiState.color.xy)
			this.state.color = `hsb(${hueSat.hue}, ${hueSat.sat}, ${brightness})`
		}

		this.state.on = apiState.on?.on ?? false
	}

	private gatherChildStates() {
		let on = false
		for (const childId of this.config.lightIds) {
			const childLight = LightResource.storage.getById(`philips-hue.${childId}`)
			if (!childLight) {
				console.log("Missing", `philips-hue.${childId}`)
				continue
			}
			console.log("Child!", childLight.state)

			if (childLight.state.on) {
				on = true
			}
		}
		this.state.on = on
	}

	async setLightState(color: LightColor, on: Toggle, transition: number) {
		const parsedColor = LightColor.parse(color)

		if (on == "toggle") {
			//this.gatherChildStates()
			on = !this.state.on
		}

		const update: HUEApiLightUpdate = {
			on: {
				on,
			},
			dimming: {
				brightness: _clamp(Number(parsedColor.bri), 0, 100),
			},
			dynamics: {
				duration: Math.round(transition * 1000),
			},
		}

		if ("hue" in parsedColor) {
			const hue = _clamp(parsedColor.hue ?? 0, 0, 360)
			const sat = _clamp(parsedColor.sat ?? 100, 0, 100)
			const bri = _clamp(parsedColor.bri ?? 100, 0, 100)
			const cie = chromatism.convert({ h: hue, s: sat, v: bri }).xyY
			update.color = {
				xy: {
					x: cie.x,
					y: cie.y,
				},
			}
		} else {
			update.color_temperature = {
				mirek: Math.round(1000000 / parsedColor.kelvin),
			}
		}

		await hubRequest(this.hubInfo, "put", `/resource/grouped_light/${this.config.providerId}`, update)
	}
}

export class PhilipsHUEPlug extends PlugResource {
	constructor(lightInfo: HUEApiLight, private hubInfo: HubInfo) {
		super()

		this._id = `philips-hue.${lightInfo.id}`
		this._config = {
			name: lightInfo.metadata.name,
			provider: "philips-hue",
			providerId: lightInfo.id,
		}

		this.state = {
			on: lightInfo.on?.on ?? false,
		}
	}

	parseApiState(apiState: HUEApiLightState) {
		this.state.on = apiState.on?.on ?? false
	}

	async setPlugState(on: Toggle): Promise<void> {
		if (on == "toggle") {
			on = !this.state.on
		}

		await hubRequest(this.hubInfo, "put", `/resource/light/${this.config.providerId}`, {
			on: {
				on,
			},
		})
	}
}

export async function injectResourceFromApi(lightInfo: HUEApiLight, hubInfo: HubInfo) {
	if ("color" in lightInfo || "color_temperature" in lightInfo || "dimming" in lightInfo) {
		const light = new PhilipsHUELight(lightInfo, hubInfo)
		await LightResource.storage.inject(light)
	} else {
		//It's a plug!
		const plug = new PhilipsHUEPlug(lightInfo, hubInfo)
		await PlugResource.storage.inject(plug)
	}
}

export function setupResources(hubIp: ReactiveRef<string | undefined>, hubKey: ReactiveRef<string | undefined>) {
	async function clearResources() {
		await removeAllSubResource(PhilipsHUELight)
		await removeAllSubResource(PhilipsHUEPlug)
	}

	async function loadResources() {
		if (!hubIp.value || !hubKey.value) return

		await clearResources()

		const hubInfo: HubInfo = {
			hubIp: hubIp.value,
			hubKey: hubKey.value,
		}

		const lightsResp = await hubRequest(hubInfo, "get", `/resource/light`)
		const lights = lightsResp.data.data as HUEApiLight[]

		const roomsResp = await hubRequest(hubInfo, "get", "/resource/room")
		const rooms = roomsResp.data.data as HUEApiRoom[]

		for (const lightInfo of lights) {
			await injectResourceFromApi(lightInfo, hubInfo)
		}

		for (const roomInfo of rooms) {
			const group = new PhilipsHUEGroup(roomInfo, hubInfo)
			await group.initialize()
			await await LightResource.storage.inject(group)
		}
	}

	onLoad(async () => {
		await loadResources()
	})

	onSettingChanged([hubIp, hubKey], async () => {
		await loadResources()
	})
}
