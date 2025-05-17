export interface MidiPortConfig {
	name: string
	midiDeviceName: string
	shouldConnect: boolean
}

export interface MidiPortState {
	connected: boolean
}

export interface JZZPortInfo {
	name: string
	manufacturer: string
	version: string
	engine: string
	sysex?: boolean
}
