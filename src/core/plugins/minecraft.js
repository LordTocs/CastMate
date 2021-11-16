const { Rcon } = require('rcon-client');
const { template } = require('../utils/template');


module.exports = {
	name: "minecraft",
	uiName: "Minecraft",
	async init()
	{
		this.startConnectLoop();
	},
	methods: {
		async tryConnect()
		{
			try
			{
				this.rcon = await Rcon.connect({
					host: this.settings.host,
					port: this.settings.port,
					password: this.secrets.password
				});

				this.rcon.on('end', () =>
				{
					this.startConnectLoop();
				})

				return true;
			}
			catch (err)
			{
				return false;
			}
		},

		async startConnectLoop()
		{
			this.rcon = null;

			if (!this.settings.host)
				return;
			if (!this.settings.port)
				return;
			if (!this.secrets.password)
				return;

			while (!(await this.tryConnect()));
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
			data: {
				type: String,
				template: true,
			},
			async handler(command, context)
			{
				if (!this.rcon)
				{
					return;
				}
				let fullCommand = await template(command, context);
				this.logger.info(`MCRCON Send:  ${fullCommand}`);
				let result = await this.rcon.send(fullCommand);
				this.logger.info(`MCRCON Recv:  ${result}`);
			}
		}
	}
}