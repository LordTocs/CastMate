import {
	MatchingTrie,
	buildMatchingTrie,
	buildTrieRegex,
	findNextTrieMatch,
	escapeRegExp,
} from "../util/substring-helper"

export interface EmoteImageURLs {
	url1x?: string
	url2x?: string
	url3x?: string
	url4x?: string
}

export interface EmoteInfo {
	id: string
	provider: string
	name: string
	urls: EmoteImageURLs
	aspectRatio: number
}

export interface EmoteSet {
	provider: string
	name: string
	id: string
	emotes: Record<string, EmoteInfo>
}

export interface EmoteParsedMessageChunk {
	type: "message"
	message: string
}

export interface EmoteParsedEmoteChunk {
	type: "emote"
	emote: EmoteInfo
}

export type EmoteParsedChunk = EmoteParsedMessageChunk | EmoteParsedEmoteChunk

export type EmoteParsedString = EmoteParsedChunk[]

export interface EmoteMatcher {
	regex: RegExp
}

export function getAllEmotes(emoteSets: EmoteSet[]) {
	const emotes = new Set<string>()

	for (const emoteSet of emoteSets) {
		for (const emote in emoteSet.emotes) {
			emotes.add(emote)
		}
	}

	return [...emotes]
}

export function createEmoteRegex(emoteSets: EmoteSet[]) {
	const trieRegex = buildTrieRegex(getAllEmotes(emoteSets).map((e) => `\\b${escapeRegExp(e)}\\b`))
	return trieRegex
}

export function createEmoteTrie(emoteSets: EmoteSet[]) {
	const names: string[] = []

	for (const emoteSet of emoteSets) {
		names.push(...Object.keys(emoteSet.emotes))
	}

	return buildMatchingTrie(names)
}

export function parseEmotesTrie(message: string, emotes: EmoteSet[], trie: MatchingTrie): EmoteParsedString {
	const result: EmoteParsedString = []

	let index = 0
	let match = findNextTrieMatch(message, trie, index)

	while (match) {
		const emoteName = match.match
		const emoteStartIndex = match.index
		if (emoteStartIndex > index) {
			result.push({
				type: "message",
				message: message.substring(index, emoteStartIndex),
			})
		}
		index = emoteStartIndex + emoteName.length

		let emote: EmoteInfo | undefined = undefined
		for (const emoteSet of emotes) {
			emote = emoteSet.emotes[emoteName]
			if (emote) break
		}

		if (emote) {
			result.push({
				type: "emote",
				emote,
			})
		}

		match = findNextTrieMatch(message, trie, index)
	}

	if (index < message.length) {
		result.push({
			type: "message",
			message: message.substring(index),
		})
	}

	return result
}

export function parseEmotesRegex(message: string, emotes: EmoteSet[], matchingExpr: string) {
	const result: EmoteParsedString = []

	const matcherRegex = new RegExp(matchingExpr, "g")

	let match: RegExpExecArray | null = null
	let index = 0
	while ((match = matcherRegex.exec(message)) !== null) {
		const emoteName = match[0]

		const emoteStartIndex = matcherRegex.lastIndex - emoteName.length
		if (emoteStartIndex > index) {
			result.push({
				type: "message",
				message: message.substring(index, emoteStartIndex),
			})
		}
		index = matcherRegex.lastIndex

		let emote: EmoteInfo | undefined = undefined
		for (const emoteSet of emotes) {
			emote = emoteSet.emotes[emoteName]
			if (emote) break
		}

		if (emote) {
			result.push({
				type: "emote",
				emote,
			})
		}
	}

	if (index < message.length) {
		result.push({
			type: "message",
			message: message.substring(index),
		})
	}

	return result
}
