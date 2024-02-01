import { FileResource, Resource, ResourceStorage, defineAction, definePluginResource } from "castmate-core"
import { TTSVoiceConfig, TTSVoiceProviderConfig } from "castmate-plugin-sound-shared"
import { Schema } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"

export class TTSVoiceProvider<
	ExtendedProviderConfig extends TTSVoiceProviderConfig = TTSVoiceProviderConfig
> extends Resource<ExtendedProviderConfig> {
	static storage = new ResourceStorage<TTSVoiceProvider>("TTSVoiceProvider")

	getVoiceConfigSchema(): Schema {
		return { type: Object, properties: {} }
	}

	async generate(text: string, voiceConfig: any): Promise<string | undefined> {
		return undefined
	}
}

export class TTSVoice extends FileResource<TTSVoiceConfig> {
	static resourceDirectory: string = "./sound/tts"
	static storage = new ResourceStorage<TTSVoice>("TTSVoice")

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this._config = {
			name: name ?? "",
			voiceProvider: "",
			providerConfig: {},
		}
	}

	async generate(text: string): Promise<string | undefined> {
		const provider = TTSVoiceProvider.storage.getById(this.config.voiceProvider)
		if (!provider) return undefined

		return await provider.generate(text, this.config.providerConfig)
	}
}

export function setupTTS() {
	definePluginResource(TTSVoiceProvider)
	definePluginResource(TTSVoice)
}
