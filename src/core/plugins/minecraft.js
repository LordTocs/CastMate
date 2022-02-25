const Rcon = require('rcon');
const { template } = require('../utils/template');
const { sleep } = require("../utils/sleep.js");


module.exports = {
	name: "minecraft",
	uiName: "Minecraft",
	icon: "mdi-minecraft",
	color: "#66A87B",
	async init() {
		this.startConnectLoop();
	},
	methods: {
		tryConnect() {
			return new Promise((resolve, reject) => {
				try {
					this.rcon = new Rcon(
						this.settings.host,
						Number(this.settings.port),
						this.secrets.password,
					);

					this.logger.info(`Trying MC Connection ${this.settings.host}:${this.settings.port}`)

					this.rcon.connect();

					this.rcon.on('auth', () => {
						this.logger.info("Connected to Minecraft!");
						resolve(true);
					})

					this.rcon.on('response', (str) => {
						this.logger.info (`MC Resp: ${str}`)
					})

					this.rcon.on('end', async () => {
						this.logger.info("Minecraft Connection Ended.");
						await sleep(5000);
						this.tryConnect();
						resolve(false)
					})

					this.rcon.on("error", (err) => {
						this.logger.info("Error!");
						this.logger.error(String(err));
						resolve(false);
					})
				}
				catch (err) {
					this.logger.error(err);
					resolve(false)
				}
			});
		},

		async startConnectLoop() {
			this.rcon = null;
			

			if (!this.settings.host)
				return;
			if (!this.settings.port)
				return;
			if (!this.secrets.password)
				return;

			this.logger.info("Starting MC Connection Loop");
			await this.tryConnect();
		}
	},
	settings: {
		host: { type: String, name: "Server" },
		port: { type: Number, name: "Port" },
	},
	secrets: {
		password: { type: String, name: "RCON Password" }
	},
	actions: {
		mineCmd: {
			name: "Minecraft Command",
			icon: "mdi-minecraft",
			color: "#66A87B",
			data: {
				type: Object,
				properties: {
					command: { type: String, template: true }
				}
			},
			async handler(command, context) {
				if (!this.rcon) {
					return;
				}
				try {
					this.logger.info("MCRCON START " + command.command)
					let fullCommand = await template(command.command, context);
					this.logger.info(`MCRCON Send:  ${fullCommand}`);
					let result = await this.rcon.send(fullCommand);
					this.logger.info(`MCRCON Recv:  ${result}`);
				}
				catch(err)
				{
					this.logger.error(err);
				}
			}
		}
	}
}