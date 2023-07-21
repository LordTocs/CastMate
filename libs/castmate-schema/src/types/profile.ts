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
	triggers: TriggerData[]
}
