import { SoundOutputConfig } from "./main"

export interface AudioRedirect {
	id: string
	output?: string
	mute: boolean
	volume: number
}

export interface AudioRedirectorConfig extends SoundOutputConfig {
	type: "redirector"
	redirects: AudioRedirect[]
}
