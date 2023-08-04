import { ChatClient } from "@twurple/chat"
import { defineTrigger, defineAction } from "castmate-core"
import { TwitchAccount } from "./auth"

export function setupChat() {
	const chatClient = new ChatClient({
		//authProvider: //botAuth ?? channelAuth,
	})

	defineAction({
		id: "chat",
		name: "Send Chat",
		icon: "mdi mdi-chat",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				message: { type: String, template: true, required: true, default: "" },
			},
		},
		async invoke(config, context, abortSignal) {
			//TODO: Channel
			await chatClient.say("lordtocs", config.message)
		},
	})

	const chat = defineTrigger({
		id: "chat",
		name: "Chat Command",
		icon: "mdi mdi-chat",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				command: { type: String },
			},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
				message: { type: String, required: true },
			},
		},
		async handle(config, context) {
			if (!config.command) {
				return true
			}

			if (context.message.toLowerCase().startsWith(config.command?.toLowerCase())) {
				return true
			}

			return false
		},
	})
}
