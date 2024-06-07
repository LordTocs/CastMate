import { BooleanExpression } from "../data/boolean-expression"
import { Toggle } from "../data/toggle"
import { InlineAutomation, AutomationData } from "./automations"

export interface TriggerData<Config = any> extends InlineAutomation {
	id: string
	plugin?: string
	trigger?: string
	config: Config
	stop?: boolean
}

export interface ProfileConfig {
	name: string
	activationMode: Toggle
	triggers: TriggerData[]
	activationCondition: BooleanExpression

	activationAutomation: InlineAutomation
	deactivationAutomation: InlineAutomation
}

export interface ProfileState {
	active: boolean
}
