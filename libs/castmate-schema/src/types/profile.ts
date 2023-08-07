import { Toggle } from "../data/toggle"
import { FloatingSequence, Sequence } from "./sequence"

export interface TriggerData {
	id: string
	plugin?: string
	trigger?: string
	queue: string | null
	config: any
	sequence: Sequence
	floatingSequences: FloatingSequence[]
}

export interface ProfileData {
	name: string
	activationMode: Toggle
	triggers: TriggerData[]
}
