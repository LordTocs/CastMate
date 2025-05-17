import { MidiPortConfig } from "castmate-plugin-midi-shared"

export interface MidiPageData {
	inputs: {
		id: string
		config: MidiPortConfig
	}[]
	outputs: {
		id: string
		config: MidiPortConfig
	}[]
}
