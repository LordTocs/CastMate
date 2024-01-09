import { AutomationData } from "./profile"

export interface StreamPlanSegment {
	id: string
	name: string
	components: Record<string, any>
	activationAutomation: AutomationData
	deactivationAutomation: AutomationData
}

export interface StreamPlanConfig {
	name: string
	activationAutomation: AutomationData
	deactivationAutomation: AutomationData

	segments: StreamPlanSegment[]
}

export interface StreamPlanState {
	active: boolean
	activeSegment?: string
}
