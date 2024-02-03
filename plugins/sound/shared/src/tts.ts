export interface TTSVoiceProviderConfig {
	name: string
	provider: string
	providerId: string
}

export interface TTSVoiceConfig {
	name: string
	voiceProvider: string
	providerConfig: object
}
