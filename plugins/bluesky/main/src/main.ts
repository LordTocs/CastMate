import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	defineResourceSetting,
	definePluginResource,
} from "castmate-core"
import { BlueSkyAccount } from "./bluesky-account"

export default definePlugin(
	{
		id: "bluesky",
		name: "BlueSky",
		description: "Blue Sky",
		color: "#1086FE",
		icon: "bsi bsi-logo",
	},
	() => {
		definePluginResource(BlueSkyAccount)

		defineResourceSetting(BlueSkyAccount, "BlueSky Accounts")

		defineAction({
			id: "post",
			name: "BlueSky Post",
			icon: "bsi bsi-logo",
			config: {
				type: Object,
				properties: {
					account: { type: BlueSkyAccount, name: "Account", required: true },
					text: { type: String, name: "Text", required: true, template: true, multiLine: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				config.account.agent.post({
					text: config.text,
				})
			},
		})
	}
)
