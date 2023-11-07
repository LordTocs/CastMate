import { LightResource } from "castmate-plugin-iot-main"
import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, defineSecret, defineSetting } from "castmate-core"
import axios, { AxiosInstance } from "axios"
import { TwinklyDiscovery } from "./discovery"
import { PollingLight } from "castmate-plugin-iot-main/src/light"
import { LightColor, LightConfig } from "castmate-plugin-iot-shared"

import {
	TwinklyAuthResponse,
	TwinklyGestaltResponse,
	authenticate,
	getTwinklyColor,
	getTwinklyInfo,
	getTwinklyMode,
	setTwinklyColor,
	turnTwinklyOff,
} from "./api"
import { Toggle } from "castmate-schema"

interface TwinklyLightConfig extends LightConfig {
	ip: string
}

class TwinklyLight extends PollingLight<TwinklyLightConfig> {
	api: AxiosInstance

	private authToken: string | undefined = undefined
	private authExpiry: number | undefined = undefined

	constructor(ip: string, id: string) {
		super()

		this._id = `twinkly.${id}`
		this._config = {
			name: id,
			provider: "twinkly",
			providerId: id,
			ip,
			dimming: {
				available: true,
			},
			rgb: {
				available: true,
			},
			transitions: {
				available: false,
			},
			kelvin: {
				available: false,
			},
		}

		this.api = axios.create({
			baseURL: `http://${this.config.ip}/xled/v1/`,
		})

		//@ts-ignore
		this.state = {}
	}

	async authenticate() {
		const tokens = await authenticate(this.config.ip)
		if (!tokens) {
			console.error("Auth Failed")
			return false
		}

		this.authToken = tokens.authentication_token
		//Set the expiry slightly early to reauth.
		this.authExpiry = Date.now() + tokens.authentication_token_expires_in - 5 * 1000
		return true
	}

	isAuthenticated() {
		if (!this.authToken) return false
		if (!this.authExpiry) return false
		if (this.authExpiry > Date.now()) return false
		return true
	}

	async initialize() {
		const deviceData = await getTwinklyInfo(this.config.ip)

		await this.applyConfig({
			name: deviceData.device_name,
			kelvin: {
				available: deviceData.led_profile.includes("W"),
			},
		})

		await this.authenticate()
		await this.poll()

		this.startPolling(30)
	}

	async setLightState(color: LightColor, on: Toggle, transition: number): Promise<void> {
		if (!this.authToken || !this.isAuthenticated()) {
			await this.authenticate()

			if (!this.authToken) {
				return
			}
		}

		if (on == "toggle") {
			await this.poll()
			on = !this.state.on
		}

		if (on) {
			await setTwinklyColor(this.config.ip, this.authToken, color)
		} else {
			await turnTwinklyOff(this.config.ip, this.authToken)
		}
	}

	async poll() {
		if (!this.authToken) return
		const mode = await getTwinklyMode(this.config.ip, this.authToken)
		const color = await getTwinklyColor(this.config.ip, this.authToken)

		this.state.on = mode != "off"
		this.state.color = color
	}
}

export default definePlugin(
	{
		id: "twinkly",
		name: "Twinkly",
		icon: "iot iot-twinkly",
		color: "#7F743F",
	},
	() => {
		const subnetMask = defineSetting("subnetMask", {
			type: String,
			required: true,
			name: "TP-Link Kasa Subnet Mask",
			default: "255.255.255.255",
		})

		let discovery: TwinklyDiscovery

		onLoad(async () => {
			discovery = new TwinklyDiscovery()
			await discovery.initialize()

			discovery.onDiscover.register(async (ip, id) => {
				//Check if we already have it
				const existing = LightResource.storage.getById(`twinkly.${id}`)
				if (existing) return

				const twinkly = new TwinklyLight(ip, id)
				await twinkly.initialize()
				await LightResource.storage.inject(twinkly)
			})

			discovery.startPolling()
		})
	}
)
