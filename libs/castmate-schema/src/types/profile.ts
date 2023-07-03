import { Sequence } from "./sequence"

export interface TriggerData {
	id: string
	plugin?: string
	trigger?: string
	queue: string | null
	config: any
	sequenece: Sequence
}

export interface ProfileData {
	triggers: TriggerData[]
}
