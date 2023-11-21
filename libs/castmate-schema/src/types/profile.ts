import { BooleanExpression } from "../data/boolean-expression"
import { Toggle } from "../data/toggle"
import { FloatingSequence, Sequence } from "./sequence"

export interface AutomationData {
	sequence: Sequence
	floatingSequences: FloatingSequence[]
}

export interface TriggerData<Config = any> extends AutomationData {
	id: string
	plugin?: string
	trigger?: string
	queue: string | null
	config: Config
}

export interface ProfileConfig {
	name: string
	activationMode: Toggle
	triggers: TriggerData[]
	activationCondition: BooleanExpression
}

export interface ProfileState {
	active: boolean
}
