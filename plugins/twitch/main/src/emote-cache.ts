import { Service, onLoad } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import {
	EmoteImageURLs,
	EmoteInfo,
	EmoteParsedString,
	EmoteSet,
	createEmoteRegex,
	parseEmotesRegex,
} from "castmate-plugin-twitch-shared"
import { HelixChannelEmote, HelixEmote } from "@twurple/api"
import { onChannelAuth } from "./api-harness"

export interface TwitchEmoteProvider {
	readonly id: string
	initialize(): any
	reset(): any
	getSets(): Promise<EmoteSet[]>
	onSetUpdated: (set: EmoteSet) => any
	onSetRemoved: (id: string) => any
	onSetAdded: (set: EmoteSet) => any
}

export function helixToEmoteInfo(helixEmote: HelixEmote): EmoteInfo {
	const result: EmoteInfo = {
		id: helixEmote.id,
		provider: "twitch",
		name: helixEmote.name,
		urls: {},
		aspectRatio: 1,
	}

	const isAnimated = helixEmote.formats.includes("animated")

	for (const scale of helixEmote.scales) {
		let urlKey: keyof EmoteImageURLs
		if (scale == "1.0") {
			urlKey = "url1x"
		} else if (scale == "2.0") {
			urlKey = "url2x"
		} else if (scale == "3.0") {
			urlKey = "url3x"
		} else {
			continue
		}

		const url = isAnimated ? helixEmote.getAnimatedImageUrl(scale) : helixEmote.getStaticImageUrl(scale)

		if (url) {
			result.urls[urlKey] = url
		}
	}

	return result
}

class TwitchNativeEmoteProvider implements TwitchEmoteProvider {
	get id() {
		return "twitch"
	}

	async initialize() {}

	reset() {}

	private getEmoteSet(name: string, id: string, emotes: HelixEmote[]) {
		const set: EmoteSet = {
			provider: "twitch",
			id,
			name,
			emotes: {},
		}

		for (const helixEmote of emotes) {
			const emote = helixToEmoteInfo(helixEmote)
			set.emotes[emote.name] = emote
		}

		return set
	}

	async getSets(): Promise<EmoteSet[]> {
		const channelEmotes = await TwitchAccount.channel.apiClient.chat.getChannelEmotes(
			TwitchAccount.channel.twitchId
		)

		const globalEmotes = await TwitchAccount.channel.apiClient.chat.getGlobalEmotes()

		return [
			this.getEmoteSet("Global Twitch Emotes", "twitch", globalEmotes),
			this.getEmoteSet("Channel Twitch Emotes", "channel", channelEmotes),
		]
	}

	onSetUpdated: (set: EmoteSet) => any
	onSetRemoved: (id: string) => any
	onSetAdded: (set: EmoteSet) => any
}

export const EmoteCache = Service(
	class {
		private providers = new Map<string, TwitchEmoteProvider>()
		private emoteSets = new Map<string, EmoteSet>()
		private matchingExpression: string = ""
		private thirdPartyMatching: string = ""
		private inited = false

		constructor() {
			this.registerEmoteProvider(new TwitchNativeEmoteProvider())
		}

		registerEmoteProvider(provider: TwitchEmoteProvider) {
			this.providers.set(provider.id, provider)
		}

		async reset() {
			this.inited = false
			this.emoteSets = new Map()

			for (const provider of this.providers.values()) {
				provider.reset()
			}
		}

		private updateMatcher() {
			this.matchingExpression = createEmoteRegex([...this.emoteSets.values()])

			this.thirdPartyMatching = createEmoteRegex(
				[...this.emoteSets.values()].filter((s) => s.provider != "twitch")
			)
		}

		async initialize() {
			for (const provider of this.providers.values()) {
				provider.onSetAdded = (set) => {
					this.emoteSets.set(`${set.provider}.${set.id}`, set)
					this.updateMatcher()
				}

				provider.onSetRemoved = (id) => {
					this.emoteSets.delete(`${provider.id}.${id}`)
					this.updateMatcher()
				}

				provider.onSetUpdated = (set) => {
					this.updateMatcher()
				}
			}

			this.inited = true

			await Promise.all([...this.providers.values()].map((p) => p.initialize()))

			const setList = await Promise.all([...this.providers.values()].map((p) => p.getSets()))

			for (const providerSets of setList) {
				for (const set of providerSets) {
					this.emoteSets.set(`${set.provider}.${set.id}`, set)
				}
			}

			this.updateMatcher()
		}

		parseThirdParty(message: EmoteParsedString) {
			const result: EmoteParsedString = []

			for (let i = 0; i < message.length; ++i) {
				const chunk = message[i]
				if (chunk.type == "message") {
					const subresult = parseEmotesRegex(
						chunk.message,
						[...this.emoteSets.values()],
						this.thirdPartyMatching
					)
					result.push(...subresult)
				} else {
					result.push(chunk)
				}
			}

			return result
		}

		parseMessage(message: string) {
			return parseEmotesRegex(message, [...this.emoteSets.values()], this.matchingExpression)
		}
	}
)

export function setupEmotes() {
	onLoad(() => {
		EmoteCache.initialize()
	})

	onChannelAuth(async (channel, services) => {
		await EmoteCache.getInstance().reset()

		await EmoteCache.getInstance().initialize()
	})
}
