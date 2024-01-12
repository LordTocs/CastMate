import { InlineAutomation } from "./automations"
import { AutomationData } from "./profile"

export interface StreamPlanSegment {
	id: string
	name: string
	components: Record<string, any>
	activationAutomation: InlineAutomation
	deactivationAutomation: InlineAutomation
}

export interface StreamPlanConfig {
	name: string
	activationAutomation: InlineAutomation
	deactivationAutomation: InlineAutomation

	segments: StreamPlanSegment[]
}

export interface StreamPlanState {
	active: boolean
	activeSegment?: string
}
