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
	sleep,
	timeout,
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

import * as chromatism from "chromatism2"
import { createDelayedResolver, DelayedResolver, Toggle } from "castmate-schema"
import { PollingPlug } from "castmate-plugin-iot-main/src/plug"

interface GoveeBulbConfig extends LightConfig {
	model: string
	hasCloud: boolean
	hasLan: boolean
	ip: string
}

import { GoveeLan, GoveeLANScan, GoveeLANStatus } from "./lan"

const logger = usePluginLogger("govee")

const lan = new GoveeLan()

class GoveeBulb extends LightResource<GoveeBulbConfig> {
	private pollResolver: DelayedResolver<void> | undefined

	constructor(mac: string) {
		super()
		this._id = `govee.${mac}`

		this._config = {
			name: mac,
			ip: "",
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

	setLANStatus(status: GoveeLANStatus) {
		this.state.on = status.onOff != 0

		if (status.color.r != 0 || status.color.g != 0 || status.color.b != 0) {
			const hsv = chromatism.convert(status.color).hsv
			this.state.color = LightColor.serialize({
				hue: hsv.h,
				sat: hsv.s,
				bri: status.brightness,
			})
		} else {
			this.state.color = LightColor.serialize({
				kelvin: status.colorTemInKelvin,
				bri: status.brightness,
			})
		}

		this.pollResolver?.resolve()
	}

	async forcePoll() {
		if (this.config.hasLan) {
			if (!this.pollResolver) {
				this.pollResolver = createDelayedResolver()
			}
			const raceResolver = Promise.race([this.pollResolver.promise, timeout(1000, "Poll failed!")])

			lan.sendStatusQuery(this.config.ip).catch((err) => {
				logger.error("Error Sending GOVEE Status Query", err)
			})

			try {
				await raceResolver
			} catch (err) {
				logger.log(err)
			} finally {
				this.pollResolver = undefined
			}
		} else {
			const apiKey = getPluginSetting<string | undefined>("govee", "apiKey")
			if (!apiKey?.value) return
			const resp = await getDeviceState(apiKey.value, this.config.providerId, this.config.model)
			this.parseCloudState(resp)
		}
	}

	async setLanScan(device: GoveeLANScan) {
		//The lan api doesn't support device capability queries, because Govee sucks.
		await this.applyConfig({
			hasLan: true,
			ip: device.ip,
			model: device.device,
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

	async setLightState(color: LightColor | undefined, on: Toggle, transition: number) {
		logger.log("Setting Govee Light State", color, on)
		if (on == "toggle") {
			await this.forcePoll()
			on = !this.state.on
		}

		if (this.config.hasLan) {
			logger.log("Updating Lan!", color, on)
			if (on) {
				if (color) {
					const parsedColor = LightColor.parse(color)
					if ("hue" in parsedColor) {
						const rgb = chromatism.convert({ h: parsedColor.hue, s: parsedColor.sat, v: 100 }).rgb
						await Promise.allSettled([
							lan.sendColorRGB(this.config.ip, rgb),
							lan.sendBrightness(this.config.ip, parsedColor.bri),
						])
					} else {
						await Promise.allSettled([
							lan.sendColorTemp(this.config.ip, parsedColor.kelvin),
							lan.sendBrightness(this.config.ip, parsedColor.bri),
						])
					}
				}
			}

			await lan.sendOnOff(this.config.ip, on)
		} else if (this.config.hasCloud) {
			logger.log("Updating Cloud!", color, on)
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

		let cloudPoller: NodeJS.Timer | undefined
		let lanPoller: NodeJS.Timer | undefined

		async function shutdown() {
			await removeAllSubResource(GoveeBulb)
			if (cloudPoller) {
				//@ts-ignore
				clearInterval(cloudPoller)
				cloudPoller = undefined
			}

			if (lanPoller) {
				//@ts-ignore
				clearInterval(lanPoller)
				lanPoller = undefined
			}
		}

		async function initialize() {
			await shutdown()

			await lan.initialize()

			lan.on("device-scan", async (ip, scan) => {
				const existing = LightResource.storage.getById(`govee.${scan.device}`) as GoveeBulb | undefined
				if (existing) {
					await existing.setLanScan(scan)
				} else {
					const newBulb = new GoveeBulb(scan.device)
					await newBulb.setLanScan(scan)
					await LightResource.storage.inject(newBulb)
				}
			})

			lan.on("device-status", (ip, status) => {
				for (const light of LightResource.storage) {
					if ("ip" in light.config && light.config.ip == ip) {
						const goveeLight = light as GoveeBulb
						goveeLight.setLANStatus(status)
					}
				}
			})

			// lan = new goveeLan.Govee({
			// 	//listenTo: "192.168.1.25",
			// 	discover: false,
			// 	debug: true,
			// })

			// lan.on(goveeLan.GoveeEventTypes.Error, (err) => {
			// 	logger.error("Govee Lan Error", err)
			// })

			// lan.on(goveeLan.GoveeEventTypes.NewDevice, async (device) => {
			// 	logger.log("Govee LAN New Device", device.id, device.name, device)
			// 	const existing = LightResource.storage.getById(`govee.${device.id}`) as GoveeBulb | undefined
			// 	if (existing) {
			// 		await existing.setLanDevice(device)
			// 	} else {
			// 		const newBulb = new GoveeBulb(device.id)
			// 		await newBulb.setLanDevice(device)
			// 		await LightResource.storage.inject(newBulb)
			// 	}
			// })

			startLanPolling()
			await startCloudPolling()
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
				// logger.log("Govee Cloud Poll", devices)

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

		async function startCloudPolling() {
			cloudPoller = setInterval(async () => {
				await cloudPoll()
			}, 5 * 60 * 1000) //Poll every 5 minutes to conserve daily rate limit. (We get 10000 every 24hours! This is 288)

			await cloudPoll()
		}

		function startLanPolling() {
			lanPoll()
			lanPoller = setInterval(() => {
				lanPoll()
			}, 10 * 1000)
		}

		async function lanPoll() {
			logger.log("Govee LAN Poll")
			lan.poll()
		}
	}
)
