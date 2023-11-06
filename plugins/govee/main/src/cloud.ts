import axios from "axios"
import { LightColor } from "castmate-plugin-iot-shared"
import * as chromatism from "chromatism2"

//https://govee-public.s3.amazonaws.com/developer-docs/GoveeDeveloperAPIReference.pdf

type GoveeCloudCommands = "turn" | "brightness" | "color" | "colorTem"

export interface GoveeCloudDevice {
	device: string //mac
	model: string
	controllable: boolean
	retrievable: boolean
	supportCmds: GoveeCloudCommands[]
	properties?: {
		colorTem?: {
			range: {
				min: number
				max: number
			}
		}
	}
}

interface GoveeCloudResponse {
	code: number
	message: string
	data: any
}

interface GoveeCloudDevicesResponse extends GoveeCloudResponse {
	data: {
		devices: GoveeCloudDevice[]
	}
}

export async function getDevices(apiKey: string) {
	const respRaw = await axios.get(`https://developer-api.govee.com/v1/devices`, {
		headers: {
			"Govee-API-KEY": apiKey,
		},
	})

	const resp = respRaw.data as GoveeCloudDevicesResponse

	const bulbs = resp.data.devices.filter(
		(d) =>
			d.supportCmds.includes("brightness") ||
			d.supportCmds.includes("color") ||
			d.supportCmds.includes("colorTem")
	)

	const plugs = resp.data.devices.filter(
		(d) =>
			!(
				d.supportCmds.includes("brightness") ||
				d.supportCmds.includes("color") ||
				d.supportCmds.includes("colorTem")
			)
	)

	return { bulbs, plugs }
}

interface OnlineProp {
	online: "true" | "false"
}

interface PowerProp {
	powerState: "on" | "off"
}

interface BrightnessProp {
	brightness: number
}

interface ColorProp {
	color: { r: number; g: number; b: number }
}

interface ColorTemProp {
	colorTem: number
}

type GoveeCloudDeviceStateProperty = OnlineProp | PowerProp | BrightnessProp | ColorProp | ColorTemProp

export interface GoveeCloudDeviceStateResponse extends GoveeCloudResponse {
	data: {
		device: string
		model: string
		name: string
		properties: GoveeCloudDeviceStateProperty[]
	}
}

export async function getDeviceState(apiKey: string, mac: string, model: string) {
	const respRaw = await axios.get(`https://developer-api.govee.com/v1/devices/state`, {
		params: {
			device: mac,
			model,
		},
		headers: {
			"Govee-API-KEY": apiKey,
			"Content-Type": "application/json",
		},
	})

	return respRaw.data as GoveeCloudDeviceStateResponse
}

export async function setPowerState(apiKey: string, mac: string, model: string, power: boolean) {
	const respRaw = await axios.put(
		`https://developer-api.govee.com/v1/devices/control`,
		{
			device: mac,
			model,
			cmd: {
				name: "turn",
				value: power ? "on" : "off",
			},
		},
		{
			headers: {
				"Govee-API-KEY": apiKey,
				"Content-Type": "application/json",
			},
		}
	)

	return respRaw.data.code == 200
}

export async function setColor(apiKey: string, mac: string, model: string, color: LightColor) {
	const parsedColor = LightColor.parse(color)

	if ("hue" in parsedColor) {
		//RGB
		const rgb = chromatism.convert({ h: parsedColor.hue, s: parsedColor.sat, v: parsedColor.bri }).rgb
		const respRaw = await axios.put(
			`https://developer-api.govee.com/v1/devices/control`,
			{
				device: mac,
				model,
				cmd: {
					name: "color",
					value: rgb,
				},
			},
			{
				headers: {
					"Govee-API-KEY": apiKey,
					"Content-Type": "application/json",
				},
			}
		)

		return respRaw.data.code == 200
	} else {
		const tempResp = axios.put(
			`https://developer-api.govee.com/v1/devices/control`,
			{
				device: mac,
				model,
				cmd: {
					name: "colorTem",
					value: parsedColor.kelvin,
				},
			},
			{
				headers: {
					"Govee-API-KEY": apiKey,
					"Content-Type": "application/json",
				},
			}
		)
		const briResp = axios.put(
			`https://developer-api.govee.com/v1/devices/control`,
			{
				device: mac,
				model,
				cmd: {
					name: "brightness",
					value: parsedColor.bri,
				},
			},
			{
				headers: {
					"Govee-API-KEY": apiKey,
					"Content-Type": "application/json",
				},
			}
		)
		const resps = await Promise.allSettled([tempResp, briResp])
		return (
			resps[0].status == "fulfilled" &&
			resps[0].value.data.code == 200 &&
			resps[1].status == "fulfilled" &&
			resps[1].value.data.code == 200
		)
	}
}
