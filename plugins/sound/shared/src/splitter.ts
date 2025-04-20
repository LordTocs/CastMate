import { SoundOutputConfig } from "./main"

export interface AudioSplit {
	id: string
	output?: string
	mute: boolean
	volume: number
}

export interface AudioSplitterConfig extends SoundOutputConfig {
	type: "splitter"
	redirects: AudioSplit[]
}
