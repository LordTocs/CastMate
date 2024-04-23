import { TwitchAccount } from "./twitch-auth"
import axios, { AxiosResponse } from "axios"
import { EmoteCache, EmoteProvider, onLoad } from "castmate-core"
import { onChannelAuth } from "./api-harness"
import { EmoteImageURLs, EmoteInfo, EmoteSet } from "castmate-schema"

interface SevenTVFile {
	name: string
	static_name: string
	width: number
	height: number
	frame_count: number
	size: number
	format: "WEBP" | "AVIF"
}

interface SevenTVEmote {
	id: string
	name: string
	flags: number
	timestamp: number
	actor_id: string
	data: {
		id: string
		name: string
		flags: number
		tags: string[]
		lifecycle: number
		state: string[]
		listed: boolean
		animated: boolean
		owner: {
			id: string
			username: string
			display_name: string
			avatar_url: string
			style: Object
			roles: string[]
		}
		host: {
			url: string
			files: SevenTVFile[]
		}
	}
}

interface SevenTVEmoteSet {
	id: string
	name: string
	flags: number
	tags: string[]
	immutable: boolean
	privileged: boolean
	emotes: SevenTVEmote[]
}

interface SevenTVUserResp {
	id: string
	platform: "TWITCH"
	username: string
	display_name: string
	linked_at: number
	emote_capacity: number
	emote_set_id: string | null
	emote_set: SevenTVEmoteSet
}

function sevenTVToEmote(sevenTv: SevenTVEmote) {
	const result: EmoteInfo = {
		id: sevenTv.id,
		provider: "7tv",
		name: sevenTv.name,
		aspectRatio: 1,
		urls: {},
	}

	const baseEmote = sevenTv.data.host.files[0]

	if (!baseEmote) throw new Error("Weird 7TV Response")

	result.aspectRatio = baseEmote.height / baseEmote.width

	for (const file of sevenTv.data.host.files) {
		if (file.format != "WEBP") continue

		let urlKey: keyof EmoteImageURLs
		if (file.name.startsWith("1x")) {
			urlKey = "url1x"
		} else if (file.name.startsWith("2x")) {
			urlKey = "url2x"
		} else if (file.name.startsWith("3x")) {
			urlKey = "url3x"
		} else {
			continue
		}

		result.urls[urlKey] = `https:${sevenTv.data.host.url}/${file.name}`
	}

	return result
}

function sevenTVToEmoteSet(sevenTv: SevenTVEmoteSet) {
	const result: EmoteSet = {
		id: sevenTv.id,
		name: sevenTv.name,
		provider: "7tv",
		emotes: {},
	}

	for (const sevenTvEmote of sevenTv.emotes) {
		const emote = sevenTVToEmote(sevenTvEmote)
		result.emotes[emote.name] = emote
	}

	return result
}

class SevenTVEmoteProvider implements EmoteProvider {
	get id() {
		return "7tv"
	}

	private emoteSets: EmoteSet[] = []

	async getSets(): Promise<EmoteSet[]> {
		return this.emoteSets
	}

	async initialize() {
		if (!TwitchAccount.channel.isAuthenticated) return

		try {
			const globalResp = await axios.get<SevenTVEmoteSet>("https://7tv.io/v3/emote-sets/global")
			const userResp = await axios.get<SevenTVUserResp>(
				`https://7tv.io/v3/users/twitch/${TwitchAccount.channel.twitchId}`
			)

			const globalSet = sevenTVToEmoteSet(globalResp.data)
			const userSet = sevenTVToEmoteSet(userResp.data.emote_set)
			this.emoteSets = [globalSet, userSet]
		} catch (err) {}
	}

	reset() {
		for (const set of this.emoteSets) {
			this.onSetRemoved?.(set.id)
		}

		this.initialize().then(() => {
			for (const set of this.emoteSets) {
				this.onSetAdded?.(set)
			}
		})
	}

	onSetUpdated: ((set: EmoteSet) => any) | undefined
	onSetRemoved: ((id: string) => any) | undefined
	onSetAdded: ((set: EmoteSet) => any) | undefined
}

export function setup7tv() {
	const sevenTvEmotes = new SevenTVEmoteProvider()

	onLoad(() => {
		EmoteCache.getInstance().registerEmoteProvider(sevenTvEmotes)
	})

	onChannelAuth((channel, service) => {
		sevenTvEmotes.reset()
	})
}
