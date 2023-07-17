export class Sequence implements SequenceActions {
	actions: (InstantAction | TimeAction | ActionStack | FlowAction)[]

	constructor() {
		this.actions = []
	}
}

export interface ActionInfo {
	id: string
	plugin: string
	action: string
	//version: SemanticVersion
	config: any
}

export interface SubFlow extends SequenceActions {
	config: any
}

export interface FlowAction extends ActionInfo {
	subFlows: SubFlow[]
}

export interface InstantAction extends ActionInfo {}

export interface TimeAction extends ActionInfo {
	offsets: OffsetActions[]
	config: {
		duration: number
	}
}

export interface ActionStack {
	id: string
	stack: InstantAction[]
}

export interface SequenceActions {
	actions: (InstantAction | TimeAction | ActionStack | FlowAction)[]
}

export interface OffsetActions extends SequenceActions {
	id: string
	offset: number
}
