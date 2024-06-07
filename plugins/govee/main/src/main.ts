import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	defineSecret,
	removeAllSubResource,
	getPluginSetting,
	onSettingChanged,
	usePluginLogger,
} from "castmate-core"
import { LightResource, PlugResource } from "castmate-plugin-iot-main"
import {
	GoveeCloudDevice,
	GoveeCloudDeviceStateResponse,
	getDeviceState,
	getDevices,
	setColor,
	setPowerState,
} from "./cloud"
import { LightColor, LightConfig, PlugConfig } from "castmate-plugin-iot-shared"
import { PollingLight } from "castmate-plugin-iot-main/src/light"

import * as chromatism from "chromatism2"
import { Toggle } from "castmate-schema"
import { PollingPlug } from "castmate-plugin-iot-main/src/plug"

interface GoveeBulbConfig extends LightConfig {
	model: string
	hasCloud: boolean
	hasLan: boolean
}

import * as goveeLan from "@j3lte/govee-lan-controller"

const logger = usePluginLogger("govee")

type GoveeLanState = ReturnType<goveeLan.Device["getState"]>

class GoveeBulb extends PollingLight<GoveeBulbConfig> {
	private lanDevice: goveeLan.Device | undefined = undefined

	constructor(mac: string) {
		super()
		this._id = `govee.${mac}`

		this._config = {
			name: mac,
			model: "",
			provider: "govee",
			providerId: mac,
			hasCloud: false,
			hasLan: false,
			dimming: {
				available: false,
			},
			rgb: {
				available: false,
			},
			kelvin: {
				available: false,
			},
			transitions: {
				available: false,
			},
		}

		//@ts-ignore
		this.state = {}
	}

	private parseLanState(state: GoveeLanState) {
		this.state.on = state.onOff != 0

		if (state.info.lastChanged == "color") {
			const hsv = chromatism.convert(state.color).hsv
			this.state.color = LightColor.serialize({
				hue: hsv.h,
				sat: hsv.s,
				bri: state.brightness,
			})
		} else {
			this.state.color = LightColor.serialize({
				kelvin: state.colorTemInKelvin,
				bri: state.brightness,
			})
		}
	}

	async setLanDevice(device: goveeLan.Device) {
		this.lanDevice = device
		//The lan api doesn't support device capability queries, because Govee sucks.
		await this.applyConfig({
			hasLan: true,
			model: device.model,
			dimming: {
				available: true,
			},
			rgb: {
				available: true,
			},
			/*kelvin: {
				available: false
			}*/
		})

		this.lanDevice.on(goveeLan.GoveeDeviceEventTypes.StateChange, (state) => {
			this.parseLanState(state)
		})

		this.startPolling(30)
	}

	async setCloudDevice(device: GoveeCloudDevice) {
		const apiKey = getPluginSetting<string | undefined>("govee", "apiKey")

		if (!apiKey?.value) return

		const state = await getDeviceState(apiKey.value, this.config.providerId, device.model)
		this.parseCloudState(state)
		await this.applyConfig({
			model: device.model,
			name: device.deviceName,
			hasCloud: true,
			dimming: {
				available: device.supportCmds.includes("brightness"),
			},
			rgb: {
				available: device.supportCmds.includes("color"),
			},
			kelvin: {
				available: device.supportCmds.includes("colorTem"),
				min: device.properties?.colorTem?.range?.min,
				max: device.properties?.colorTem?.range?.max,
			},
		})

		//NEVER POLL for cloud info, we'll get rate limited!
		//this.startPolling(30)
	}

	private parseCloudState(resp: GoveeCloudDeviceStateResponse) {
		let color: { r: number; g: number; b: number } | undefined = undefined
		let power: boolean | undefined = undefined
		let brightness: number | undefined = undefined
		let kelvin: number | undefined = undefined

		for (const prop of resp.data.properties) {
			if ("color" in prop) {
				color = prop.color
			} else if ("powerState" in prop) {
				power = prop.powerState == "on"
			} else if ("brightness" in prop) {
				brightness = prop.brightness
			} else if ("colorTem" in prop) {
				kelvin = prop.colorTem
			}
		}

		if (power != null) {
			this.state.on = power
		}

		if (kelvin != null && brightness != null) {
			this.state.color = `kb(${kelvin}, ${brightness})`
		}
		if (color != null && brightness != null) {
			const hsv = chromatism
		}
	}

	async poll(force?: boolean) {
		if (this.config.hasLan && this.lanDevice) {
			if (force) {
				await this.lanDevice.sync()
				const deviceState = this.lanDevice.getState()
				this.parseLanState(deviceState)
			} else {
				this.lanDevice.triggerUpdate()
			}
		} else if (this.config.hasCloud) {
			const apiKey = getPluginSetting<string | undefined>("govee", "apiKey")
			if (!apiKey?.value) return
			const resp = await getDeviceState(apiKey.value, this.config.providerId, this.config.model)
			this.parseCloudState(resp)
		}
	}

	async setLightState(color: LightColor | undefined, on: Toggle, transition: number) {
		//logger.log("Setting Govee Light State", color, on)
		if (on == "toggle") {
			await this.poll(true)
			on = !this.state.on
		}

		if (this.config.hasLan && this.lanDevice) {
			//logger.log("Updating Lan!", color, on)
			if (color) {
				const parsedColor = LightColor.parse(color)
				if ("hue" in parsedColor) {
					await this.lanDevice.setColor({ h: parsedColor.hue, s: parsedColor.sat, v: parsedColor.bri })
				} else {
					await Promise.allSettled([
						this.lanDevice.setColorKelvin(parsedColor.kelvin, true),
						this.lanDevice.setBrightness(parsedColor.bri),
					])
				}
			}

			if (on) {
				await this.lanDevice.turnOn()
			} else {
				await this.lanDevice.turnOff()
			}
		} else if (this.config.hasCloud) {
			//logger.log("Updating Cloud!", color, on)
			const apiKey = getPluginSetting<string | undefined>("govee", "apiKey")
			if (!apiKey?.value) return
			await Promise.allSettled([
				color ? setColor(apiKey.value, this.config.providerId, this.config.model, color) : undefined,
				setPowerState(apiKey.value, this.config.providerId, this.config.model, on),
			])
		}
	}
}

interface GoveePlugConfig extends PlugConfig {
	model: string
	hasCloud: boolean
	hasLan: boolean
}

class GoveePlug extends PollingPlug<GoveePlugConfig> {
	constructor(mac: string) {
		super()

		this._id = `govee.${mac}`

		this._config = {
			name: mac,
			provider: "govee",
			providerId: mac,
			model: "",
			hasCloud: false,
			hasLan: false,
		}

		//@ts-ignore
		this.state = {}
	}

	async setCloudDevice(device: GoveeCloudDevice) {
		const apiKey = getPluginSetting<string | undefined>("govee", "apiKey")

		if (!apiKey?.value) return

		const state = await getDeviceState(apiKey.value, this.config.providerId, device.model)
		await this.applyConfig({
			model: device.model,
			name: device.deviceName,
			hasCloud: true,
		})

		await this.poll()

		//NEVER POLL FOR CLOUD INFO WE'll GET RATE LIMITED
		//this.startPolling(30)
	}

	async poll() {
		if (this.config.hasCloud) {
			const apiKey = getPluginSetting<string | undefined>("govee", "apiKey")
			if (!apiKey?.value) return
			const resp = await getDeviceState(apiKey.value, this.config.providerId, this.config.model)
			this.parseCloudState(resp)
		}
	}

	private parseCloudState(resp: GoveeCloudDeviceStateResponse) {
		let power: boolean | undefined = undefined

		for (const prop of resp.data.properties) {
			if ("powerState" in prop) {
				power = prop.powerState == "on"
			}
		}

		if (power != null) this.state.on = power
	}

	async setPlugState(on: Toggle) {
		if (on == "toggle") {
			await this.poll()
			on = !this.state.on
		}

		const apiKey = getPluginSetting<string | undefined>("govee", "apiKey")
		if (!apiKey?.value) return

		await setPowerState(apiKey.value, this.config.providerId, this.config.model, on)
	}
}

export default definePlugin(
	{
		id: "govee",
		name: "Govee",
		icon: "iot iot-govee",
		color: "#7F743F",
	},
	() => {
		const apiKey = defineSecret("apiKey", {
			type: String,
			name: "Govee API Key",
		})

		let lan: goveeLan.Govee
		let poller: NodeJS.Timer | undefined

		async function shutdown() {
			await removeAllSubResource(GoveeBulb)
			if (poller) {
				//@ts-ignore
				clearInterval(poller)
				poller = undefined
			}
		}

		async function initialize() {
			await shutdown()

			lan = new goveeLan.Govee({
				//listenTo: "192.168.1.25",
				discover: false,
				// debug: true,
			})

			lan.on(goveeLan.GoveeEventTypes.Error, (err) => {
				logger.error("Govee Lan Error", err)
			})

			lan.on(goveeLan.GoveeEventTypes.NewDevice, async (device) => {
				const existing = LightResource.storage.getById(`govee.${device.id}`) as GoveeBulb | undefined
				if (existing) {
					await existing.setLanDevice(device)
				} else {
					const newBulb = new GoveeBulb(device.id)
					await newBulb.setLanDevice(device)
					await LightResource.storage.inject(newBulb)
				}
			})

			poller = setInterval(async () => {
				await cloudPoll()
				lanPoll()
			}, 5 * 60 * 1000) //Poll every 5 minutes to conserve daily rate limit. (We get 10000 every 24hours! This is 288)

			await cloudPoll()
			lanPoll()
		}

		onLoad(async () => {
			await initialize()
		})

		onUnload(async () => {
			await shutdown()
		})

		onSettingChanged(apiKey, () => {
			initialize()
		})

		async function cloudPoll() {
			if (!apiKey.value) return

			try {
				const devices = await getDevices(apiKey.value)

				for (const cloudBulb of devices.bulbs) {
					const existing = LightResource.storage.getById(`govee.${cloudBulb.device}`) as GoveeBulb | undefined
					if (existing) {
						await existing.setCloudDevice(cloudBulb)
					} else {
						const newBulb = new GoveeBulb(cloudBulb.device)
						await newBulb.setCloudDevice(cloudBulb)
						await LightResource.storage.inject(newBulb)
					}
				}

				for (const cloudPlug of devices.plugs) {
					const existing = PlugResource.storage.getById(`govee.${cloudPlug.device}`) as GoveePlug | undefined
					if (existing) {
						await existing.setCloudDevice(cloudPlug)
					} else {
						const newPlug = new GoveePlug(cloudPlug.device)
						await newPlug.setCloudDevice(cloudPlug)
						await PlugResource.storage.inject(newPlug)
					}
				}
			} catch (err) {
				logger.error("Error Polling Govee", err)
			}
		}

		function lanPoll() {
			lan.discover()
		}
	}
)
