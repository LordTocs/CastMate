import { DiscordWebhookConfig } from "castmate-plugin-discord-shared"
import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	FileResource,
	ResourceStorage,
	definePluginResource,
} from "castmate-core"
import { WebhookClient } from "discord.js"

class DiscordWebHook extends FileResource<DiscordWebhookConfig> {
	static resourceDirectory = "./discord/webhooks"
	static storage = new ResourceStorage<DiscordWebHook>("DiscordWebhook")

	client: WebhookClient

	async load(savedConfig: DiscordWebhookConfig): Promise<boolean> {
		this.client = new WebhookClient({ url: savedConfig.webhookUrl })
		return await super.load(savedConfig)
	}

	async setConfig(config: DiscordWebhookConfig): Promise<boolean> {
		this.client = new WebhookClient({ url: config.webhookUrl })
		return await super.setConfig(config)
	}

	async applyConfig(config: Partial<DiscordWebhookConfig>): Promise<boolean> {
		if (!(await super.applyConfig(config))) return false
		this.client = new WebhookClient({ url: this.config.webhookUrl })
		return true
	}
}

export default definePlugin(
	{
		id: "discord",
		name: "Discord",
		description: "UI Description",
		icon: "mdi mdi-discord",
		color: "#7289da",
	},
	() => {
		definePluginResource(DiscordWebHook)

		defineAction({
			id: "discordMessage",
			name: "Discord Message",
			icon: "mdi mdi-message",
			config: {
				type: Object,
				properties: {
					webhook: { type: DiscordWebHook, name: "Channel Webhook", required: true },
					message: { type: String, name: "Message", required: true, default: "", template: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				await config.webhook?.client?.send({
					content: config.message,
				})
			},
		})
	}
)
