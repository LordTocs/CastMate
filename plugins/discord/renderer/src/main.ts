import { useResourceStore, ResourceSettingList, ResourceSchemaEdit } from "castmate-ui-core"
import "./css/discord.css"

export function initPlugin() {
	const resourceStore = useResourceStore()

	resourceStore.registerSettingComponent("DiscordWebhook", ResourceSettingList)
	resourceStore.registerEditComponent("DiscordWebhook", ResourceSchemaEdit)
	resourceStore.registerCreateComponent("DiscordWebhook", ResourceSchemaEdit)

	resourceStore.registerConfigSchema("DiscordWebhook", {
		type: Object,
		properties: {
			name: { type: String, name: "Connection Name", required: true },
			webhookUrl: { type: String, name: "Webhook URL", required: true, secret: true },
		},
	})
}
