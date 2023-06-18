import Rcon from "rcon"
import { template } from "../state/template.js"
import { sleep } from "../utils/sleep.js"

export default {
	name: "minecraft",
	uiName: "Minecraft",
	icon: "mdi-minecraft",
	color: "#66A87B",
	async init() {
		this.connectionState = "Disconnected"
		this.startConnectLoop()
	},
	methods: {
		tryConnect() {
			try {
				this.rcon = new Rcon(
					this.settings.host,
					Number(this.settings.port),
					this.secrets.password
				)

				//this.logger.info(`Trying MC Connection ${this.settings.host}:${this.settings.port}`)

				this.connectionState = "Connecting"
				this.rcon.connect()

				this.rcon.on("auth", () => {
					this.logger.info("Connected to Minecraft!")
					this.analytics.set({ usesMinecraft: true })
					this.connectionState = "Connected"
				})

				this.rcon.on("response", (str) => {
					this.logger.info(`MC Resp: ${str}`)
				})

				this.rcon.on("end", async () => {
					this.logger.info("Minecraft Connection Ended.")
					this.connectionState = "Disconnected"
					if (this.disconnectFunc) this.disconnectFunc()
				})

				this.rcon.on("error", (err) => {
					//this.logger.error(String(err));
					this.connectionState = "Disconnected"
					if (this.errorFunc) this.errorFunc(err)
				})
			} catch (err) {
				this.connectionState = "Disconnected"
				//this.logger.error(err);
				if (this.errorFunc) this.errorFunc(err)
			}
		},

		async retry() {
			if (this.connectionState != "Disconnected") return
			await sleep(5000)
			this.tryConnect()
		},

		async startConnectLoop() {
			this.rcon = null

			if (!this.settings.host) return
			if (!this.settings.port) return
			if (!this.secrets.password) return

			this.logger.info("Starting MC Connection Loop")

			this.disconnectFunc = () => this.retry()
			this.errorFunc = () => this.retry()

			this.tryConnect()
		},
		async shutdown() {
			if (this.connectionState == "Disconnected") return

			try {
				await new Promise((resolve, reject) => {
					this.disconnectFunc = () => resolve()
					this.errorFunc = (e) => reject(e)
					this.rcon.disconnect()
				})
			} catch (err) {
				this.logger.error(`Error disconnecting ${err}`)
			}
		},
	},
	async onSettingsReload() {
		await this.shutdown()

		await this.startConnectLoop()
	},
	async onSecretsReload() {
		await this.shutdown()

		await this.startConnectLoop()
	},
	settings: {
		host: { type: String, name: "Server" },
		port: { type: Number, name: "Port" },
	},
	secrets: {
		password: { type: String, name: "RCON Password" },
	},
	actions: {
		mineCmd: {
			name: "Minecraft Command",
			icon: "mdi-minecraft",
			color: "#66A87B",
			data: {
				type: Object,
				properties: {
					command: { type: String, template: true },
				},
			},
			async handler(command, context) {
				if (!this.rcon) {
					return
				}
				try {
					this.logger.info("MCRCON START " + command.command)
					let fullCommand = await template(command.command, context)
					this.logger.info(`MCRCON Send:  ${fullCommand}`)
					let result = await this.rcon.send(fullCommand)
					this.logger.info(`MCRCON Recv:  ${result}`)
				} catch (err) {
					this.logger.error(err)
				}
			},
		},
	},
}
