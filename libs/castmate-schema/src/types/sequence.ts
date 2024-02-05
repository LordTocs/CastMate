import { nanoid } from "nanoid/non-secure"

export interface SequenceSource {
	type: string
	id: string
	subid?: string
}

export interface QueuedSequence {
	id: string
	source: SequenceSource
	queueContext: SequenceContext
}

export interface SequenceContext {
	//TODO: Previous action context information
	//TODO: Future action context information
	contextState: Record<string, any>
}

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
	resultMapping?: Record<string, string>
}

export interface SubFlow extends SequenceActions {
	id: string
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

export function getActionById(id: string, sequence: Sequence): AnyAction | ActionStack | undefined {
	for (const action of sequence.actions) {
		if (action.id == id) {
			return action
		} else {
			if (isTimeAction(action)) {
				for (const offset of action.offsets) {
					const subAction = getActionById(id, offset)
					if (subAction) return subAction
				}
			} else if (isActionStack(action)) {
				for (const subAction of action.stack) {
					if (subAction.id == id) {
						return subAction
					}
				}
			} else if (isFlowAction(action)) {
				for (const subFlow of action.subFlows) {
					const subAction = getActionById(id, subFlow)
					if (subAction) return subAction
				}
			}
		}
	}
	return undefined
}

export function assignNewIds(sequence: Sequence) {
	for (const action of sequence.actions) {
		action.id = nanoid()
		if (isTimeAction(action)) {
			for (const offsetSeq of action.offsets) {
				offsetSeq.id = nanoid()
				assignNewIds(offsetSeq)
			}
		} else if (isActionStack(action)) {
			for (const item of action.stack) {
				item.id = nanoid()
			}
		} else if (isFlowAction(action)) {
			for (const subFlow of action.subFlows) {
				subFlow.id = nanoid()
				assignNewIds(subFlow)
			}
		}
	}
}
