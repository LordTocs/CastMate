export type AnyAction = InstantAction | TimeAction | FlowAction

export interface SequenceActions {
	actions: (InstantAction | TimeAction | ActionStack | FlowAction)[]
}

export interface Sequence extends SequenceActions {}

export type NonStackActionInfo = InstantAction | TimeAction | FlowAction

export interface FloatingSequence extends Sequence {
	x: number
	y: number
	id: string
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

export interface TimeActionInfo {
	minLength: number
	duration: number
	maxLength: number | undefined
}

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

export interface OffsetActions extends SequenceActions {
	id: string
	offset: number
}

export function isActionStack(action: InstantAction | TimeAction | ActionStack | FlowAction): action is ActionStack {
	return "stack" in action
}

export function isFlowAction(action: InstantAction | TimeAction | ActionStack | FlowAction): action is FlowAction {
	return "subFlows" in action
}

export function isTimeAction(action: InstantAction | TimeAction | ActionStack | FlowAction): action is TimeAction {
	return "offsets" in action
}

export function isInstantAction(action: InstantAction | TimeAction | ActionStack | FlowAction): action is TimeAction {
	return !isActionStack(action) && !isFlowAction(action) && !isTimeAction(action)
}
