import { LightResource } from "castmate-plugin-iot-main"
import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	defineSecret,
	defineSetting,
	AsyncCache,
} from "castmate-core"
import axios, { AxiosInstance } from "axios"
import { TwinklyDiscovery } from "./discovery"
import { PollingLight } from "castmate-plugin-iot-main/src/light"
import { LightColor, LightConfig } from "castmate-plugin-iot-shared"

import {
	TwinklyAuthResponse,
	TwinklyGestaltResponse,
	TwinklyMovie,
	authenticateTwinkly,
	getTwinklyColor,
	getTwinklyInfo,
	getTwinklyMode,
	getTwinklyMovies,
	setTwinklyColor,
	setTwinklyMovie,
	turnTwinklyOff,
	setTwinklyMode,
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
		const tokens = await authenticateTwinkly(this.config.ip)
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
		await this.authenticate()

		try {
			const deviceData = await getTwinklyInfo(this.config.ip)

			await this.applyConfig({
				name: deviceData.device_name,
				kelvin: {
					available: deviceData.led_profile.includes("W"),
				},
			})

			await this.poll()
		} catch (err) {
			console.error("Error Querying Twinkly Info")
			console.error(err)
		}

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
			await setTwinklyMode(this.config.ip, this.authToken, "color")
		} else {
			await turnTwinklyOff(this.config.ip, this.authToken)
		}
	}

	async poll() {
		if (!this.authToken || !this.isAuthenticated()) {
			await this.authenticate()

			if (!this.authToken) {
				return
			}
		}

		try {
			const mode = await getTwinklyMode(this.config.ip, this.authToken)
			this.state.on = mode != "off"
		} catch (err) {
			console.log("Failed to get twinkly mode", err)
		}

		try {
			const color = await getTwinklyColor(this.config.ip, this.authToken)
			this.state.color = color
		} catch (err) {
			console.log("Failed to get twinkly color")
		}
	}

	private movieCache = new AsyncCache<TwinklyMovie[]>(async () => {
		if (!this.authToken || !this.isAuthenticated()) {
			await this.authenticate()

			if (!this.authToken) {
				return []
			}
		}
		const movies = await getTwinklyMovies(this.config.ip, this.authToken)
		return movies.movies
	})
	getMovies() {
		return this.movieCache.get()
	}

	async setMovie(id: string) {
		if (!this.authToken || !this.isAuthenticated()) {
			await this.authenticate()

			if (!this.authToken) {
				return
			}
		}

		await setTwinklyMovie(this.config.ip, this.authToken, id)
		await setTwinklyMode(this.config.ip, this.authToken, "movie")
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
				try {
					await twinkly.initialize()
					await LightResource.storage.inject(twinkly)
				} catch (err) {
					console.error("Error Initializing Twinkly", ip, id, err)
				}
			})

			discovery.startPolling()
		})

		defineAction({
			id: "movie",
			name: "Twinkly Movie",
			icon: "iot iot-twinkly",
			config: {
				type: Object,
				properties: {
					twinkly: {
						type: LightResource,
						name: "Twinkly Device",
						filter: { provider: "twinkly" },
						required: true,
					},
					movie: {
						type: String,
						name: "Movie",
						required: true,
						async enum(context: { twinkly: TwinklyLight }) {
							if (!context.twinkly) return []

							const movies = await context.twinkly.getMovies()
							return movies?.map((m) => ({ name: m.name, value: m.id })) ?? []
						},
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				await (config.twinkly as TwinklyLight)?.setMovie(config.movie)
			},
		})
	}
)
