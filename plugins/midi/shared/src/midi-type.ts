import { registerType, SchemaBase } from "castmate-schema"

export const MidiStatuses = {
	"Note Off": 0x8,
	"Note On": 0x9,
	"Polyphonic Aftertouch": 0xa,
	Control: 0xb,
	"Program Change": 0xc,
	"Channel Aftertouch": 0xd,
	"Pitch Wheel": 0xe,
	System: 0xf,
}

export interface MidiMessage {
	status: number
	subStatus: number
	data1: number
	data2: number
}

export const MidiMessage = {
	factoryCreate(): MidiMessage {
		return { status: 0, subStatus: 0, data1: 0, data2: 0 }
	},
}
type MidiMessageFactory = typeof MidiMessage

export interface SchemaMidiMessage extends SchemaBase<MidiMessage> {
	type: MidiMessageFactory
	template?: boolean
	inputProp?: string
	outputProp?: string
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		MidiMessage: [SchemaMidiMessage, MidiMessage]
	}
}

registerType("MidiMessage", {
	constructor: MidiMessage,
	icon: "mdi mdi-midi",
	canBeVariable: false,
	canBeViewerVariable: false,
})
