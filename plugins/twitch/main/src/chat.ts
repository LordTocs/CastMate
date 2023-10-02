import { ChatClient } from "@twurple/chat"
import { defineTrigger, defineAction } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { TwitchAPIService, onChannelAuth } from "./api-harness"
import { Color, Range } from "castmate-schema"
import { ViewerCache } from "./viewer-cache"
import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { inTwitchViewerGroup } from "./group"

export function setupChat() {
	defineAction({
		id: "chat",
		name: "Chat Message",
		icon: "mdi mdi-chat",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				message: { type: String, template: true, required: true, default: "", name: "Message" },
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
				command: { type: String, name: "Command", required: true, default: "" },
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
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
			console.log("Handling", config.command, context.message)
			if (!context.message.toLocaleLowerCase().startsWith(config.command?.toLocaleLowerCase())) {
				return false
			}

			if (!(await inTwitchViewerGroup(context.userId, config.group))) {
				return false
			}

			return true
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
			return config.bits.inRange(context.bits)
		},
	})

	onChannelAuth((account, service) => {
		console.log("Handling Auth")
		service.chatClient.onMessage(async (channel, user, message, msgInfo) => {
			const context = {
				user: msgInfo.userInfo.displayName,
				userId: msgInfo.userInfo.userId,
				userColor: msgInfo.userInfo.color as Color,
				message,
				messageId: msgInfo.id,
			}

			ViewerCache.getInstance().cacheChatUser(msgInfo.userInfo)
			console.log(message)

			if (msgInfo.isFirst) {
				firstTimeChat(context)
			}

			chat(context)
		})

		service.eventsub.onChannelShoutoutCreate(account.twitchId, account.twitchId, async (event) => {
			shoutoutSent({
				user: event.shoutedOutBroadcasterDisplayName,
				userId: event.shoutedOutBroadcasterId,
				userColor: await ViewerCache.getInstance().getChatColor(event.shoutedOutBroadcasterId),
			})
		})

		service.eventsub.onChannelCheer(account.twitchId, async (event) => {
			bits({
				bits: event.bits,
				user: event.userDisplayName ?? "Anonymous", //TODO: Setting for anonymous gifter name
				userId: event.userId ?? "",
				userColor: event.userId ? await ViewerCache.getInstance().getChatColor(event.userId) : "#000000",
				message: event.message,
			})
		})
	})
}
