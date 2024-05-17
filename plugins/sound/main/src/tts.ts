import { FileResource, Resource, ResourceStorage, defineAction, definePluginResource, onLoad } from "castmate-core"
import { TTSVoiceConfig, TTSVoiceProviderConfig } from "castmate-plugin-sound-shared"
import { Schema, SchemaType, declareSchema } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { OsTTSInterface, OsTTSVoice } from "castmate-plugin-sound-native"
import { app } from "electron"
import * as path from "path"

export class TTSVoiceProvider<
	ExtendedProviderConfig extends TTSVoiceProviderConfig = TTSVoiceProviderConfig
> extends Resource<ExtendedProviderConfig> {
	static storage = new ResourceStorage<TTSVoiceProvider>("TTSVoiceProvider")

	getVoiceConfigSchema(): Schema | undefined {
		return undefined
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
			providerConfig: {
				pitch: 0,
				rate: 0,
			},
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

function escapeXml(unsafe: string) {
	return unsafe.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case "<":
				return "&lt;"
			case ">":
				return "&gt;"
			case "&":
				return "&amp;"
			case "'":
				return "&apos;"
			case '"':
				return "&quot;"
		}
		return c
	})
}

const OSTTSVoiceConfigSchema = declareSchema({
	type: Object,
	properties: {
		pitch: { type: Number, name: "Pitch", default: 0, min: -10, max: 10, step: 1, slider: true, required: true },
		rate: { type: Number, name: "Rate", default: 0, min: -10, max: 10, step: 1, slider: true, required: true },
	},
})
type OSTTSVoiceConfigData = SchemaType<typeof OSTTSVoiceConfigSchema>

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

	private speakToFile(text: string, filename: string, id: string) {
		return new Promise<void>((resolve, reject) => {
			this.os_interface.speakToFile(text, filename, id, (err) => {
				if (err) {
					reject(err)
				}
				resolve()
			})
		})
	}

	async generate(text: string, voiceConfig: OSTTSVoiceConfigData, filename: string) {
		const SAPIXml = `<rate absspeed="${voiceConfig.rate ?? 0}">
		<pitch absmiddle="${voiceConfig.pitch ?? 0}>
			${escapeXml(text)}
		</pitch>
		</rate>
		`

		await this.speakToFile(text, filename, this.config.providerId)
	}

	getVoiceConfigSchema(): Schema | undefined {
		return OSTTSVoiceConfigSchema
	}
}

export function setupTTS() {
	definePluginResource(TTSVoiceProvider)
	definePluginResource(TTSVoice)

	const osTts = new OsTTSInterface()

	async function getOsVoices() {
		const voices = osTts.getVoices()

		for (const voice of voices) {
			const id = `system.${voice.id}`
			const existing = TTSVoiceProvider.storage.getById(id)
			if (existing) continue

			const provider = new OSTTSVoiceProvider(voice, osTts)

			await OSTTSVoiceProvider.storage.inject(provider)
		}
	}

	onLoad(async () => {
		await getOsVoices()
	})
}
