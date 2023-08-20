import { ChatClient } from "@twurple/chat"
import { defineTrigger, defineAction } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"

export function setupChat() {
	let chatClient: ChatClient | undefined

	function shutdownTriggers() {
		if (!chatClient) return

		chatClient.quit()
	}

	function setupTriggers() {
		chatClient = new ChatClient()

		chatClient.onMessage((channel, user, text, msg) => {
			//msg.userInfo.displayName
		})
	}

	defineAction({
		id: "chat",
		name: "Send Chat",
		icon: "mdi mdi-chat",
		version: "0.0.1",
		type: "instant",
		config: {
			type: Object,
			properties: {
				message: { type: String, template: true, required: true, default: "" },
			},
		},
		async invoke(config, context, abortSignal) {
			const channel = TwitchAccount.storage.getById("channel")

			const channelName = channel?.config?.name

			if (!channelName) {
				return
			}

			//await chatClient.say(channelName, config.message)
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
				command: { type: String, name: "Command" },
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
