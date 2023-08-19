import { PanState } from "./panning"

export interface TriggerView {
	id: string
	open: boolean
	automationView: AutomationView
}

export interface SequenceView {}

export interface AutomationView {
	panState: PanState
}

export interface ProfileView {
	scrollX: number
	scrollY: number
	triggers: TriggerView[]
}
