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
	TwinklyAuthToken,
	TwinklyMovie,
	getTwinklyColor,
	getTwinklyInfo,
	getTwinklyMode,
	getTwinklyMovies,
	setTwinklyColor,
	setTwinklyMovie,
	turnTwinklyOff,
} from "./api"
import { Toggle } from "castmate-schema"

interface TwinklyLightConfig extends LightConfig {
	ip: string
}

class TwinklyLight extends PollingLight<TwinklyLightConfig> {
	api: AxiosInstance

	private authToken: TwinklyAuthToken = { token: undefined, expiry: undefined }

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

	async initialize() {
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

	async setLightState(color: LightColor | undefined, on: Toggle, transition: number): Promise<void> {
		if (on == "toggle") {
			await this.poll()
			on = !this.state.on
		}

		if (on) {
			if (color) {
				await setTwinklyColor(this.config.ip, this.authToken, color ?? this.state.color)
			}
		} else {
			await turnTwinklyOff(this.config.ip, this.authToken)
		}
	}

	async poll() {
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
		const movies = await getTwinklyMovies(this.config.ip, this.authToken)
		return movies.movies
	})
	getMovies() {
		return this.movieCache.get()
	}

	async setMovie(id: string) {
		await setTwinklyMovie(this.config.ip, this.authToken, id)
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
			name: "Twinkly Subnet Mask",
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
