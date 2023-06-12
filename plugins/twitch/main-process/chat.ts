import { ChatClient } from "@twurple/chat"
import { defineTrigger, defineAction } from "castmate-core"

export function setupChat(channelAuth, botAuth) {
	const chatClient = new ChatClient({
		authProvider: botAuth ?? channelAuth,
	})

	defineAction({
		id: "chat",
		name: "Send Chat",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				message: { type: String, template: true, required: true, default: "" },
			},
		},
		async invoke(config, context, abortSignal) {},
	})

	const chat = defineTrigger({
		id: "chat",
		name: "Chat Command",
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
