import { ChatClient, ChatMessage, parseEmotePositions } from "@twurple/chat"
import { defineTrigger, defineAction, defineTransformTrigger } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { TwitchAPIService, onChannelAuth } from "./api-harness"
import { Color, Range } from "castmate-schema"
import { ViewerCache } from "./viewer-cache"
import { EmoteParsedString, TwitchViewer, TwitchViewerGroup, testViewer } from "castmate-plugin-twitch-shared"
import { inTwitchViewerGroup } from "./group"
import { EmoteCache } from "./emote-cache"

function parseEmotesFromMsg(chatMessage: ChatMessage): EmoteParsedString {
	const result: EmoteParsedString = []

	const parsedEmotes = parseEmotePositions(chatMessage.text, chatMessage.emoteOffsets)

	let index = 0
	for (const emote of parsedEmotes) {
		const emoteIndex = emote.position
		if (emoteIndex > index) {
			result.push({
				type: "message",
				message: chatMessage.text.substring(index, emote.position),
			})
		}

		result.push({
			type: "emote",
			emote: {
				id: emote.id,
				provider: "twitch",
				name: emote.name,
				urls: {
					url1x: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/light/1.0`,
					url2x: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/light/2.0`,
					url3x: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/light/3.0`,
				},
				aspectRatio: 1,
			},
		})

		index = emote.position + emote.length
	}

	if (index < chatMessage.text.length) {
		result.push({
			type: "message",
			message: chatMessage.text.substring(index),
		})
	}

	return result
}

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
				viewer: { type: TwitchViewer, required: true, default: "27082158", name: "Viewer" },
				message: { type: String, required: true, default: "Thanks for using CastMate!" },
				messageId: { type: String, required: true, default: "1234" },
			},
		},
		async handle(config, context) {
			console.log("Handling", config.command, context.message)
			if (!context.message.toLocaleLowerCase().startsWith(config.command?.toLocaleLowerCase())) {
				return false
			}

			if (!(await inTwitchViewerGroup(context.viewer, config.group))) {
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
				viewer: { type: TwitchViewer, required: true, default: "27082158", name: "Viewer" },
				message: { type: String, required: true, default: "Thanks for using CastMate!" },
				messageId: { type: String, required: true, default: "1234" },
			},
		},
		async handle(config, context) {
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
			properties: {
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				viewer: { type: TwitchViewer, required: true, default: "27082158" },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.viewer, config.group))) {
				return false
			}

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
				bits: { type: Range, name: "Bits Cheered", required: true, default: {} },
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				bits: { type: Number, required: true, default: 100 },
				viewer: { type: TwitchViewer, required: true, default: "27082158" },
				message: { type: String, required: true, default: "Thanks for using CastMate" },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.viewer, config.group))) {
				return false
			}
			return Range.inRange(config.bits, context.bits)
		},
	})

	onChannelAuth((account, service) => {
		service.chatClient.onMessage(async (channel, user, message, msgInfo) => {
			const context = {
				viewer: msgInfo.userInfo.userId,
				message,
				messageId: msgInfo.id,
			}

			const twitchOnlyEmotes = parseEmotesFromMsg(msgInfo)
			const allEmotes = EmoteCache.getInstance().parseThirdParty(twitchOnlyEmotes)

			console.log(allEmotes)

			ViewerCache.getInstance().cacheChatUser(msgInfo.userInfo)

			if (msgInfo.isFirst) {
				firstTimeChat(context)
			}

			chat(context)
		})

		service.eventsub.onChannelShoutoutCreate(account.twitchId, account.twitchId, async (event) => {
			shoutoutSent({
				viewer: event.shoutedOutBroadcasterId,
			})
		})

		service.eventsub.onChannelCheer(account.twitchId, async (event) => {
			ViewerCache.getInstance().cacheCheerEvent(event)

			bits({
				bits: event.bits,
				viewer: event.userId ?? "anonymouse",
				message: event.message,
			})
		})
	})
}
