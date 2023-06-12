import { defineAction, definePlugin, onLoad } from "castmate-core"

export default definePlugin(
	{
		id: "twitch",
		name: "Twitch",
		description: "Provides Twitch triggers for chat, raids, and more",
		icon: "mdi-twitch",
	},
	() => {
		onLoad(() => {})
	}
)
