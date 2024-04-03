import { EmoteCache, EmoteProvider, Service, onLoad } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { HelixChannelEmote, HelixEmote } from "@twurple/api"
import { onChannelAuth } from "./api-harness"
import { EmoteImageURLs, EmoteInfo, EmoteSet } from "castmate-schema"

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

class TwitchNativeEmoteProvider implements EmoteProvider {
	get id() {
		return "twitch"
	}

	private emoteSets: EmoteSet[] = []

	async initialize() {
		if (!TwitchAccount.channel.isAuthenticated) return

		const channelEmotes = await TwitchAccount.channel.apiClient.chat.getChannelEmotes(
			TwitchAccount.channel.twitchId
		)

		const globalEmotes = await TwitchAccount.channel.apiClient.chat.getGlobalEmotes()

		this.emoteSets = [
			this.getEmoteSet("Global Twitch Emotes", "twitch", globalEmotes),
			this.getEmoteSet("Channel Twitch Emotes", "channel", channelEmotes),
		]
	}

	reset() {
		for (const set of this.emoteSets) {
			this.onSetRemoved(set.id)
		}

		this.initialize().then(() => {
			for (const set of this.emoteSets) {
				this.onSetAdded(set)
			}
		})
	}

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
		return this.emoteSets
	}

	onSetUpdated: (set: EmoteSet) => any
	onSetRemoved: (id: string) => any
	onSetAdded: (set: EmoteSet) => any
}

export function setupEmotes() {
	const nativeEmotes = new TwitchNativeEmoteProvider()

	onLoad(() => {
		EmoteCache.getInstance().registerEmoteProvider(nativeEmotes)
	})

	onChannelAuth(async (channel, services) => {
		nativeEmotes.reset()
	})
}
