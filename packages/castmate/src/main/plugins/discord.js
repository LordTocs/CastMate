import { FileResource, Resource } from "../resources/resource"
import { WebhookClient } from "discord.js"
import { template } from "../state/template"

const DISCORD_SVG =
	"svg:M19.952,5.672c-1.904-1.531-4.916-1.79-5.044-1.801c-0.201-0.017-0.392,0.097-0.474,0.281 c-0.006,0.012-0.072,0.163-0.145,0.398c1.259,0.212,2.806,0.64,4.206,1.509c0.224,0.139,0.293,0.434,0.154,0.659 c-0.09,0.146-0.247,0.226-0.407,0.226c-0.086,0-0.173-0.023-0.252-0.072C15.584,5.38,12.578,5.305,12,5.305S8.415,5.38,6.011,6.872 c-0.225,0.14-0.519,0.07-0.659-0.154c-0.14-0.225-0.07-0.519,0.154-0.659c1.4-0.868,2.946-1.297,4.206-1.509 c-0.074-0.236-0.14-0.386-0.145-0.398C9.484,3.968,9.294,3.852,9.092,3.872c-0.127,0.01-3.139,0.269-5.069,1.822 C3.015,6.625,1,12.073,1,16.783c0,0.083,0.022,0.165,0.063,0.237c1.391,2.443,5.185,3.083,6.05,3.111c0.005,0,0.01,0,0.015,0 c0.153,0,0.297-0.073,0.387-0.197l0.875-1.202c-2.359-0.61-3.564-1.645-3.634-1.706c-0.198-0.175-0.217-0.477-0.042-0.675 c0.175-0.198,0.476-0.217,0.674-0.043c0.029,0.026,2.248,1.909,6.612,1.909c4.372,0,6.591-1.891,6.613-1.91 c0.198-0.172,0.5-0.154,0.674,0.045c0.174,0.198,0.155,0.499-0.042,0.673c-0.07,0.062-1.275,1.096-3.634,1.706l0.875,1.202 c0.09,0.124,0.234,0.197,0.387,0.197c0.005,0,0.01,0,0.015,0c0.865-0.027,4.659-0.667,6.05-3.111 C22.978,16.947,23,16.866,23,16.783C23,12.073,20.985,6.625,19.952,5.672z M8.891,14.87c-0.924,0-1.674-0.857-1.674-1.913 s0.749-1.913,1.674-1.913s1.674,0.857,1.674,1.913S9.816,14.87,8.891,14.87z M15.109,14.87c-0.924,0-1.674-0.857-1.674-1.913 s0.749-1.913,1.674-1.913c0.924,0,1.674,0.857,1.674,1.913S16.033,14.87,15.109,14.87z"

class DiscordWebHook extends FileResource {
	static storageFolder = "discordhooks/"

	async setConfig(config) {
		super.setConfig(config)

		this.client = new WebhookClient({ url: config.url })
	}

	async onLoaded() {
		this.client = new WebhookClient({ url: this.config.url })
	}
}

export default {
	name: "discord",
	uiName: "Discord",
	icon: DISCORD_SVG,
	color: "#7289da",
	async init() {
		this.webhooks = new Resource(DiscordWebHook, {
			type: "discordhook",
			name: "Discord Webhook",
			description: "",
			config: {
				type: Object,
				properties: {
					name: { type: String, name: "Webhook Name" },
					url: {
						type: String,
						name: "Discord Webhook URL",
						secret: true,
					},
				},
			},
		})

		await this.webhooks.load()
	},
	actions: {
		discordMessage: {
			name: "Discord Message",
			description: "Send a Discord Message",
			icon: "mdi-message",
			color: "#7289da",
			data: {
				type: Object,
				properties: {
					channel: {
						type: DiscordWebHook,
						name: "Channel",
						required: true,
					},
					message: {
						type: String,
						name: "Message",
						template: true,
						required: true,
					},
				},
			},
			async handler(data, context) {
				const message = await template(data.message, context)

				const twitchhook = this.webhooks.getById(data.channel)

				if (!twitchhook) return

				await twitchhook.client.send({
					content: message,
				})
			},
		},
	},
	settingsView: "discord",
}
