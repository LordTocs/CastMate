//BTTV List https://betterttv.com/developers/api
//https://api.betterttv.net/3/cached/users/twitch/27082158
//BTTV CDN
//https://cdn.betterttv.net/emote/<emote id>/3x

//FFZ https://api.frankerfacez.com/docs/

//7TV https://7tv.io/docs
//7TV Events https://github.com/SevenTV/EventAPI

import joypixels from "emoji-toolkit"
import axios from "axios"

let unicodeRegExp = new RegExp(
	joypixels.escapeRegExp(joypixels.unicodeCharRegex()),
	"gi"
)

class BTTVService {
	constructor(onUpdate) {
		this.onUpdate = onUpdate
	}

	async query() {
		const resp = await axios.get(
			`https://api.betterttv.net/3/cached/users/twitch/${this.channelId}`
		)

		const emoteLookup = {}

		const sharedEmotes = resp.data.sharedEmotes
		const channelEmotes = resp.data.channelEmotes

		for (let emote of [...sharedEmotes, ...channelEmotes]) {
			emoteLookup[
				emote.code
			] = `https://cdn.betterttv.net/emote/${emote.id}/3x`
		}

		const globalResp = await axios.get(`https://api.betterttv.net/3/cached/emotes/global`)
		for (let emote of globalResp.data) {
			emoteLookup[
				emote.code
			] = `https://cdn.betterttv.net/emote/${emote.id}/3x`
		}
		this.lookup = emoteLookup
		this.onUpdate?.()
	}

	async init(channelId) {
		this.channelId = channelId
		await this.query()
		if (this.refresh) {
			clearInterval(this.refresh)
		}
		this.refresh = setInterval(() => this.query(), 60000)
	}

	get(name) {
		return this.lookup?.[name]
	}
}

class FFZService {
	constructor(onUpdate) {
		this.onUpdate = onUpdate
	}

	async query() {
		const resp = await axios.get(
			`https://api.frankerfacez.com/v1/room/id/${this.channelId}`
		)

		const lookup = {}
		for (let setId in resp.data.sets) {
			const set = resp.data.sets[setId]
			for (let emote of set.emoticons) {
				lookup[emote.name] = emote.urls["4"] || emote.urls["3"]
			}
		}

		const globalResp = await axios.get(
			`https://api.frankerfacez.com/v1/set/global`
		)
		for (let setId in globalResp.data.sets) {
			const set = globalResp.data.sets[setId]
			for (let emote of set.emoticons) {
				lookup[emote.name] = emote.urls["4"] || emote.urls["3"]
			}
		}

		this.lookup = lookup
		this.onUpdate?.()
	}

	async init(channelId) {
		this.channelId = channelId
		await this.query()
		if (this.refresh) {
			clearInterval(this.refresh)
		}
		this.refresh = setInterval(() => this.query(), 60000)
	}

	get(name) {
		return this.lookup?.[name]
	}
}

class SevenTVService {
	constructor(onUpdate) {
		this.onUpdate = onUpdate
	}

	async connect() {
		if (this.events) {
			this.events.close()
		}

		this.events = new EventSource(
			`https://events.7tv.io/v3@emote_set.update<object_id=${this.emoteSet.id}>`
		)

		this.events.addEventListener("hello", (e) => {
			console.log("7tv: HELLO!")
		})

		this.events.addEventListener("dispatch", (e) => {
			const message = JSON.parse(e.data)

			if (message.type == "emote_set.update") {
				const body = message.body

				console.log("7tv Update", message.body)

				if (body.id == this.emoteSet.id) {

					if (body.pulled) {
						//TODO: I'm unsure how this works with multiple pulled
						let offset = 0
						for (let emote of body.pulled) {
							console.log("7tv remove: ", emote)
							this.emoteSet.emotes.splice(emote.index - offset, 1)
							offset++
						}
					}

					if (body.pushed) {
						for (let emote of body.pushed) {
							console.log("7tv add: ", emote)
							this.emoteSet.emotes.push(emote.value)
						}
					}

					const lookup = {}
					for (let emote of [...this.globalEmoteSet?.emotes, ...this.emoteSet?.emotes]) {
						lookup[emote.name] = `https://cdn.7tv.app/emote/${emote.id}/3x.webp`
					}
					this.lookup = lookup

					this.onUpdate?.()
				}
			}
		})

		this.events.addEventListener(
			"error",
			(e) => {
				if (e.readyState === EventSource.CLOSED) {
					// Connection was closed.
					console.log("7TV Error", e)
				}
			},
			false
		)
	}

	async query() {
		const resp = await axios.get(
			`https://api.7tv.app/v3/users/twitch/${this.channelId}`
		)

		const { emote_set: emoteSet } = resp.data

		const globalResp = await axios.get("https://7tv.io/v3/emote-sets/global")
		const globalEmoteSet = globalResp.data

		this.emoteSet = emoteSet
		console.log("7tv Emote Set", this.emoteSet)
		this.globalEmoteSet =  globalEmoteSet
	
		console.log(globalEmoteSet.emotes[0])

		const lookup = {}
		for (let emote of [...globalEmoteSet?.emotes, ...emoteSet?.emotes]) {
			lookup[emote.name] = `https://cdn.7tv.app/emote/${emote.id}/3x.webp`
		}
		this.lookup = lookup
		this.onUpdate?.()
	}

	async init(channelId) {
		this.channelId = channelId
		await this.query()
		await this.connect()
	}

	get(name) {
		return this.lookup?.[name]
	}
}

export class EmoteService {
	constructor() {
		this.ffz = new FFZService(() => this.mergeLookups())
		this.bttv = new BTTVService(() => this.mergeLookups())
		this.seventv = new SevenTVService(() => this.mergeLookups())
	}

	async init(channelId, channelName) {
		this.channelName = channelName
		this.channelId = channelId

		if (channelId && channelName) {
			await Promise.all([this.ffz.init(channelId), this.bttv.init(channelId), this.seventv.init(channelId)].map(p => p.catch((e) => console.error(e))))
		}
	}

	async updateChannelId(channelId) {
		this.channelId = channelId

		await Promise.all([this.ffz.init(channelId), this.bttv.init(channelId), this.seventv.init(channelId)].map(p => p.catch((e) => console.error(e))))
	}

	async updateChannelName(channelName) {
	}

	mergeLookups() {
		this.thirdPartyLookup = {
			...this.bttv?.lookup,
			...this.seventv?.lookup,
			...this.ffz?.lookup,
		}
	}

	findNextEmote(message, code, index) {
		while (true) {
			index = message.indexOf(code, index)
			if (index < 0) return index
			if (
				index + code.length == message.length ||
				/\s/.test(message[index + code.length])
			) {
				return index
			}
			index += code.length
		}
	}

	parseMessage(chat) {
		const result = []

		//First emoji search
		let emojis = [...chat.message.matchAll(unicodeRegExp)]
		for (let e of emojis) {
			let shortName = joypixels.shortnameLookup[e]
			if (shortName) {
				let url =
					joypixels.defaultPathPNG +
					"64" +
					"/" +
					joypixels.emojiList[shortName].uc_base +
					joypixels.fileExtension
				result.push(url)
			}
		}

		//Then twitch emotes
		for (let emote in chat.emoteOffsets) {
			let num = chat.emoteOffsets[emote].length
			for (let i = 0; i < num; ++i) {
				result.push(
					`https://static-cdn.jtvnw.net/emoticons/v2/${emote}/default/light/3.0`
				)
			}
		}

		for (let code in this.thirdPartyLookup) {
			for (
				let index = this.findNextEmote(chat.message, code);
				index >= 0;
				index = this.findNextEmote(
					chat.message,
					code,
					index + code.length
				)
			) {
				result.push(this.thirdPartyLookup[code])
			}
		}

		return result
	}
}
