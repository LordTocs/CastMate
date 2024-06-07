import { EmoteParsedString, EmoteSet, createEmoteRegex, parseEmotesRegex } from "castmate-schema"
import { Service } from "../util/service"
import { usePluginLogger } from "../logging/logging"

export interface EmoteProvider {
	readonly id: string
	initialize(): any
	reset(): any
	getSets(): Promise<EmoteSet[]>
	onSetUpdated: ((set: EmoteSet) => any) | undefined
	onSetRemoved: ((id: string) => any) | undefined
	onSetAdded: ((set: EmoteSet) => any) | undefined
}

const logger = usePluginLogger("emotes")

export const EmoteCache = Service(
	class {
		private providers = new Map<string, EmoteProvider>()
		private emoteSets = new Map<string, EmoteSet>()
		private matchingExpression: string | undefined = undefined
		private thirdPartyMatching: string | undefined = undefined
		private inited = false

		constructor() {}

		registerEmoteProvider(provider: EmoteProvider) {
			this.providers.set(provider.id, provider)
			if (this.inited) {
				this.updateMatcher()
			}
		}

		private updateMatcher() {
			const sets = [...this.emoteSets.values()]
			const thirdPartySets = sets.filter((s) => s.provider != "twitch")

			if (sets.length > 0) {
				this.matchingExpression = createEmoteRegex(sets)
			} else {
				this.matchingExpression = undefined
			}

			if (thirdPartySets.length > 0) {
				this.thirdPartyMatching = createEmoteRegex(thirdPartySets)
			} else {
				this.thirdPartyMatching = undefined
			}
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
			if (!this.thirdPartyMatching) {
				return message
			}

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

		parseMessage(message: string): EmoteParsedString {
			if (!this.matchingExpression) {
				return [{ type: "message", message: message }]
			}
			return parseEmotesRegex(message, [...this.emoteSets.values()], this.matchingExpression)
		}
	}
)
