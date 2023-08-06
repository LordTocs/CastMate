import { defineAction, definePlugin, onLoad, onUnload } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { setupChat } from "./chat"
import { setupEventSub } from "./eventsub"
import { setupChannelPointRewards } from "./channelpoints"

export default definePlugin(
	{
		id: "twitch",
		name: "Twitch",
		description: "Provides Twitch triggers for chat, raids, and more",
		icon: "mdi mdi-twitch",
		color: "#5E5172",
	},
	() => {
		onLoad(() => {
			TwitchAccount.initialize()
		})

		onUnload(() => {})

		setupChat()
		setupChannelPointRewards()
		setupEventSub()
	}
)
