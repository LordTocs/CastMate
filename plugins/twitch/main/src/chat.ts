import { ChatClient } from "@twurple/chat"
import { defineTrigger, defineAction } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { TwitchAPIService, onChannelAuth } from "./api-harness"
import { Color, Range } from "castmate-schema"

export function setupChat() {
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
			await TwitchAPIService.getInstance().chatClient.say(
				TwitchAccount.channel.config.name.toLowerCase(),
				config.message
			)
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
				messageId: { type: String, required: true },
			},
		},
		async handle(config, context) {
			if (!config.command) {
				return true
			}

			console.log("Handling", config.command, context.message)
			if (context.message.toLowerCase().startsWith(config.command?.toLowerCase())) {
				return true
			}

			return false
		},
	})

	const firstTimeChat = defineTrigger({
		id: "firstTimeChat",
		name: "First Time Chatter",
		icon: "mdi mdi-medal",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {},
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
			console.log("")
			return true
		},
	})

	defineAction({
		id: "sendShoutout",
		name: "Shoutout",
		description: "Sends a shout out",
		icon: "mdi mdi-bullhorn",
		type: "instant",
		config: {
			type: Object,
			properties: {
				user: { type: String, name: "Twitch Name", template: true, required: true, default: "" },
			},
		},
		async invoke(config, contextData, abortSignal) {
			const channel = TwitchAccount.channel
			const user = await channel.apiClient.users.getUserByName(config.user)
			if (!user) {
				return
			}
			await channel.apiClient.chat.shoutoutUser(channel.twitchId, user?.id)

			TwitchAPIService.getInstance().eventsub.on
		},
	})

	const shoutoutSent = defineTrigger({
		id: "shoutoutSent",
		name: "Shout Out Sent",
		description: "Fires when /shoutout is used",
		icon: "mdi mdi-chat",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
			},
		},
		async handle(config, context) {
			return true
		},
	})

	const bits = defineTrigger({
		id: "bits",
		name: "Bits Cheered",
		description: "Fires a user cheers with bits",
		icon: "twi twi-bits",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				bits: { type: Range, name: "Bits Cheered", required: true, default: new Range() },
			},
		},
		context: {
			type: Object,
			properties: {
				bits: { type: Number, required: true },
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
				message: { type: String, required: true },
			},
		},
		async handle(config, context) {
			return true
		},
	})

	onChannelAuth((account, service) => {
		service.chatClient.onMessage(async (channel, user, message, msgInfo) => {
			const context = {
				user: msgInfo.userInfo.displayName,
				userId: msgInfo.userInfo.userId,
				userColor: msgInfo.userInfo.color as Color,
				message,
				messageId: msgInfo.id,
			}

			console.log(`${user}: ${message}`)

			if (msgInfo.isFirst) {
				firstTimeChat(context)
			}

			chat(context)
		})

		service.eventsub.onChannelShoutoutCreate(account.twitchId, account.twitchId, (event) => {
			shoutoutSent({
				user: event.shoutedOutBroadcasterDisplayName,
				userId: event.shoutedOutBroadcasterId,
				userColor: "#000000",
			})
		})

		service.eventsub.onChannelCheer(account.twitchId, (event) => {
			bits({
				bits: event.bits,
				user: event.userDisplayName ?? "Anonymous",
				userId: event.userId ?? "",
				userColor: "#000000",
				message: "",
			})
		})
	})
}
