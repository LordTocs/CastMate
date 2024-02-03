import { FileResource, Resource, ResourceStorage, defineAction, definePluginResource, onLoad } from "castmate-core"
import { TTSVoiceConfig, TTSVoiceProviderConfig } from "castmate-plugin-sound-shared"
import { Schema } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { OsTTSInterface, OsTTSVoice } from "castmate-plugin-sound-native"
import { app } from "electron"
import * as path from "path"

export class TTSVoiceProvider<
	ExtendedProviderConfig extends TTSVoiceProviderConfig = TTSVoiceProviderConfig
> extends Resource<ExtendedProviderConfig> {
	static storage = new ResourceStorage<TTSVoiceProvider>("TTSVoiceProvider")

	getVoiceConfigSchema(): Schema {
		return { type: Object, properties: {} }
	}

	async generate(text: string, voiceConfig: any, filename: string) {}
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

	async generate(text: string) {
		const provider = TTSVoiceProvider.storage.getById(this.config.voiceProvider)
		if (!provider) return

		const filename = path.join(app.getPath("temp"), `${nanoid()}.wav`)
		await provider.generate(text, this.config.providerConfig, filename)
		return filename
	}
}

export class OSTTSVoiceProvider extends TTSVoiceProvider {
	constructor(osvoice: OsTTSVoice, private os_interface: OsTTSInterface) {
		super()

		this._id = `system.${osvoice.id}`

		this._config = {
			name: osvoice.name,
			provider: "system",
			providerId: osvoice.id,
		}
	}

	async generate(text: string, voiceConfig: any, filename: string) {
		this.os_interface.speakToFile(text, filename, this.config.providerId)
	}
}

export function setupTTS() {
	definePluginResource(TTSVoiceProvider)
	definePluginResource(TTSVoice)

	const osTts = new OsTTSInterface()

	async function getOsVoices() {
		const voices = osTts.getVoices()

		console.log("Voices Detected", voices)

		let first: OSTTSVoiceProvider | undefined = undefined

		for (const voice of voices) {
			const id = `system.${voice.id}`
			const existing = TTSVoiceProvider.storage.getById(id)
			if (existing) continue

			const provider = new OSTTSVoiceProvider(voice, osTts)
			if (!first) {
				first = provider
			}

			await OSTTSVoiceProvider.storage.inject(provider)
		}

		return first
	}

	onLoad(async () => {
		const first = await getOsVoices()
	})
}
