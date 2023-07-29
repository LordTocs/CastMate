import { PanState } from "./panning"

export interface TriggerView {
	id: string
	open: boolean
	sequenceView: SequenceView
}

export interface SequenceView {
	panState: PanState
	selection: string[]
}
