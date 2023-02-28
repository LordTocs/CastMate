import { WebSocket } from "ws"
import { onStateChange } from "../state/reactive"
import axios from "axios"
import { RPCWebSocket } from "../utils/rpc-websocket.js"
import util from "util"
import { Resource } from "../resources/resource"

const iconSvg =
	"m 2.0080331,8.616092 c -4.2268094,6.315379 8.0772869,12.422668 8.3448569,12.423225 0.213948,3.62e-4 6.594607,-1.869405 5.573124,-4.027231 C 14.36785,13.720556 5.7176479,9.5778192 8.2086563,8.12845 9.3809946,7.4278447 15.357308,10.53877 16.305331,13.743698 17.970784,5.7313764 5.2620829,5.5062332 12.846312,0.95047028 -6.5179222,6.5085832 9.1201791,11.967068 7.6962099,13.160986 6.2722364,14.354901 0.51904627,12.846902 2.0080331,8.616092 Z"

let spellcastPlugin = null
class SpellCastButton {
	static async create(config) {
		const resultConfig = await spellcastPlugin.createSpell(config)

		const instance = new this()

		instance.id = resultConfig._id
		delete resultConfig._id
		delete resultConfig.connected
		delete resultConfig.streamer
		instance.config = resultConfig

		return instance
	}

	static async load() {
		const spells = await spellcastPlugin.getSpells()

		if (!spells) {
			return []
		}

		const instances = spells.map((s) => {
			const instance = new this()

			instance.id = s._id
			delete s._id
			delete s.connected
			delete s.streamer
			instance.config = s

			return instance
		})

		return instances
	}

	async clone() {
		return await this.constructor.create(this.config)
	}

	async setConfig(config) {
		const newConfig = await spellcastPlugin.updateSpell(this.id, config)

		delete newConfig._id
		delete newConfig.connected
		delete newConfig.streamer
		this.config = newConfig
	}

	async deleteSelf() {
		await spellcastPlugin.deleteSpell(this.id)
	}
}

const SPELLCAST_EXTENSION_ID = "d6rcoml9cel8i3y7amoqjsqtstwtun"

export default {
	name: "spellcast",
	uiName: "SpellCast",
	icon: `svg:${iconSvg}`,
	color: "#488EE2",
	async init() {
		this.twitch = this.plugins.getPlugin("twitch")

		spellcastPlugin = this

		this.spells = new Resource(SpellCastButton, {
			type: "spell",
			name: "Spell",
			description: "SpellCast Spell",
			inlineEdit: true,
			config: {
				type: Object,
				properties: {
					name: { type: String, name: "Name", required: true },
					description: { type: String, name: "Description" },
					bits: {
						name: "Bits",
						required: true,
						default: 10,
						type: Number,
						enum: [
							10, 20, 30, 40, 50, 100, 150, 200, 250, 300, 350,
							400, 450, 500, 550, 600, 650, 700, 750, 800, 850,
							900, 950, 1000, 1050, 1100, 1150, 1200, 1250, 1300,
							1350, 1400, 1450, 1500, 1550, 1600, 1650, 1700,
							1750, 1800, 1850, 1900, 1950, 2000,
						],
					},
					color: {
						type: "Color",
						name: "Color",
						default: "#719ece",
						enum: [
							"#719ece",
							"#803FCC",
							"#CC3F9A",
							"#CCB23F",
							"#7ECC3F",
							"#CC4141",
							"#CC691E",
						],
					},
					enabled: { type: Boolean, required: true, name: "Enabled" },
				},
			},
		})

		this.accessWatcher = onStateChange(
			this.twitch.state,
			"accessToken",
			async () => {
				await this.disconnect()
				await this.initApi()
				await this.connect()
			}
		)

		try {
			await this.initApi()
			await this.connect()
		} catch (err) {
			this.logger.error("Error connecting to SpellCast")
			this.logger.error(util.inspect(err))
		}
	},
	ipcMethods: {
		async checkExtensionStatus() {
			const isPrevActive = !!this.state.extensionActive

			await this.checkExtension()

			if (!isPrevActive && this.state.extensionActive) {
				await this.connect()
			}
		},
		async pokeSpellCastForConfig() {
			this.getSpells(); //Run GetSpells, it will force user config
		},
		async activateExtension(slot) {
			this.twitch.publicMethods.activateExtension(
				SPELLCAST_EXTENSION_ID,
				"component",
				slot,
				"0.0.1"
			)
		}
	},
	methods: {
		async checkExtension() {
			console.log("Checking SpellCast Status")
			const extensionStatus = await this.twitch.publicMethods.getExtensionInfo(
				SPELLCAST_EXTENSION_ID
			)

			this.state.extensionActive = extensionStatus.active
			this.state.extensionInstalled = extensionStatus.installed
			this.state.extensionRequiresConfig = !extensionStatus.canActivate

			this.analytics.set({
				usesSpellCast: extensionStatus.active
			})
		},
		async initApi() {
			//TODO: Fix public methods accessor.
			const accessToken = this.twitch.state.accessToken

			if (!accessToken) {
				this.logger.info(
					`Can't connect to SpellCast, no twitch sign on.`
				)
				this.apiClient = null
				return
			}

			this.apiClient = axios.create({
				baseURL: import.meta.env.VITE_SPELLCAST_URL,
			})

			this.apiClient.defaults.headers.common[
				"Authorization"
			] = `Bearer ${accessToken}`

			await this.initSpells()

			await this.checkExtension()
		},
		async retry() {
			await this.disconnect()

			//Retry connection in 5 seconds.
			if (this.reconnect) {
				this.logger.info(
					`Connection to spellcast websocket (${
						import.meta.env.VITE_SPELLCAST_SOCKET_URL
					}) failed, retrying in 5 seconds...`
				)
				setTimeout(() => {
					this.connect().catch((err) => {
						this.logger.error(`Exception on socket reconnect.`)
						this.logger.error(`${err}`)
						this.retry()
					})
				}, 5000)
			}
		},
		async disconnect() {
			if (this.websocket) {
				this.websocket.terminate()

				if (this.websocketPinger) {
					clearInterval(this.websocketPinger)
					this.websocketPinger = null
				}
			}
			this.state.connected = false
			this.websocket = null
			this.requestSocket = null
		},
		async connect() {
			if (!this.state.extensionActive) {
				this.logger.info(
					"Skipping SpellCast connection, extension not installed"
				)
				return
			}

			const accessToken = this.twitch.state.accessToken

			if (!accessToken) {
				this.logger.info(
					`Can't connect to SpellCast, no twitch sign on.`
				)
				this.apiClient = null
				return
			}

			this.reconnect = true

			this.logger.info(
				`Connecting to SpellCast (${
					import.meta.env.VITE_SPELLCAST_SOCKET_URL
				})`
			)

			this.websocket = new WebSocket(
				import.meta.env.VITE_SPELLCAST_SOCKET_URL,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			)

			this.requestSocket = new RPCWebSocket(this.websocket)

			this.requestSocket.handle("getSpells", () =>
				this.getActiveButtons()
			)
			this.requestSocket.handle("runSpell", (buttonId, context) => {
				return this.triggers.spellHook({
					hookId: buttonId,
					...context,
					userColor: this.twitch.publicMethods.getUserColor(
						context.userId
					),
				})
			})

			this.websocket.on("open", () => {
				this.logger.info(
					`Connection to SpellCast open (${
						import.meta.env.VITE_SPELLCAST_SOCKET_URL
					})`
				)
				this.state.connected = true

				//Every 30 seconds ping to keep the socket alive.
				this.websocketPinger = setInterval(() => {
					if (this.websocket?.readyState == 1) {
						this.websocket.ping()
					}
				}, 30000)
			})

			this.websocket.on("close", () => {
				this.retry()
			})

			this.websocket.on("unexpected-response", (request, response) => {
				this.logger.error(`Unexpected Response!`)
				console.log(response)
				this.retry()
			})

			this.websocket.on("error", (err) => {
				//Empty function to prevent unhandled exceptions rippling up somewhere else in the process.
				this.logger.error(`Error in SpellCast Websocket ${err}`)
			})
		},
		async initSpells() {
			if (this.spells.resources.length) {
				await this.spells.clear()
			}
			await this.spells.load()
		},
		async getSpells() {
			const channelId = this.twitch.state.channelId

			try {
				const resp = await this.apiClient.get(
					`/streams/${channelId}/buttons/`
				)
				return resp.data
			} catch (err) {
				this.logger.error(`Error loading Spells ${err}`)
			}
		},
		async getActiveButtons() {
			return Array.from(this.activeButtons)
		},
		async createSpell(spellConfig) {
			const channelId = this.twitch.state.channelId

			try {
				this.logger.info(
					`Creating Spell ${spellConfig.name} ${spellConfig.description}`
				)
				const newHook = await this.apiClient.post(
					`/streams/${channelId}/buttons/`,
					spellConfig
				)
				this.logger.info(`Created SpellHook ${newHook.data._id}`)
				return newHook.data
			} catch (err) {
				this.logger.error(`Error Creating Hook, ${err}`)
				return null
			}
		},
		async updateSpell(buttonId, spellConfig) {
			const channelId = this.twitch.state.channelId

			try {
				const newHook = await this.apiClient.put(
					`/streams/${channelId}/buttons/${buttonId}`,
					spellConfig
				)
				return newHook.data
			} catch (err) {
				this.logger.error(`Error Updating Hook, ${err}`)
			}
		},
		async deleteSpell(buttonId) {
			const channelId = this.twitch.state.channelId

			try {
				await this.apiClient.delete(
					`/streams/${channelId}/buttons/${buttonId}`
				)
			} catch (err) {
				this.logger.error(`Error Updating Hook, ${err}`)
			}
		},
	},
	triggers: {
		spellHook: {
			name: "SpellCast",
			description: "Fires when a viewer casts a spell with bits",
			config: {
				type: Object,
				properties: {
					hookId: { type: SpellCastButton, name: "Spell" },
				},
			},
			context: {
				buttonId: { type: String },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
			},
			handler(config, context) {
				return config.hookId == context.buttonId
			},
		},
	},
	async onProfileLoad(profile, config) {
		const buttonTriggers = config?.triggers?.spellcast?.spellHook

		profile.spells = buttonTriggers
			? buttonTriggers.map((rt) => rt.config.hookId)
			: []
	},
	async onProfilesChanged(activeProfiles, inactiveProfiles) {
		this.activeButtons = new Set()

		//Handle rewards
		for (let activeProf of activeProfiles) {
			for (let buttonId of activeProf.spells) {
				this.activeButtons.add(buttonId)
			}
		}

		this.logger.info(`Active Buttons: ${util.inspect(this.activeButtons)}`)

		if (this.websocket?.readyState == 1) {
			this.requestSocket.call(
				"setActiveButtons",
				Array.from(this.activeButtons)
			)
		}
	},
	state: {
		connected: {
			type: Boolean,
			name: "Connected To Spellcast",
			hidden: true,
		},
		extensionInstalled: {
			type: Boolean,
			name: "SpellCast Extension Installed",
			hidden: true,
		},
		extensionActive: {
			type: Boolean,
			name: "SpellCast Extension Active",
			hidden: true,
		},
		extensionRequiresConfig: {
			type: Boolean,
			name: "SpellCast Extension Is Awaiting Config String",
			hidden: true,
		},
	},
}
