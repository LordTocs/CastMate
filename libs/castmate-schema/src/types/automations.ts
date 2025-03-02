import {
	ActionStack,
	AnyAction,
	Sequence,
	FloatingSequence,
	getActionById,
	getActionAndPathById,
	isActionStack,
	isTimeAction,
	isFlowAction,
} from "./sequence"
import _cloneDeep from "lodash/cloneDeep"

export interface AutomationData {
	sequence: Sequence
	floatingSequences: FloatingSequence[]
}

export interface InlineAutomation extends AutomationData {
	queue?: string
}

export function createInlineAutomation(): InlineAutomation {
	return { sequence: { actions: [] }, floatingSequences: [], queue: undefined }
}

export interface AutomationConfig extends AutomationData {
	name: string
}

export function findActionById(id: string, automation: AutomationData) {
	let action: AnyAction | ActionStack | undefined = undefined

	action = getActionById(id, automation.sequence)
	if (action) {
		return action
	}

	for (const floatingSequence of automation.floatingSequences) {
		action = getActionById(id, floatingSequence)
		if (action) {
			return action
		}
	}
}

export function findActionAndSequenceById(
	id: string,
	automation: AutomationData
): { action: AnyAction | ActionStack; sequence: Sequence; path: string } | undefined {
	let actionPath: ReturnType<typeof getActionAndPathById> = undefined

	actionPath = getActionAndPathById(id, automation.sequence)
	if (actionPath) {
		return { action: actionPath.action, sequence: automation.sequence, path: `sequence.${actionPath.path}` }
	}

	//for (const floatingSequence of automation.floatingSequences) {
	for (let i = 0; i < automation.floatingSequences.length; ++i) {
		const floatingSequence = automation.floatingSequences[i]

		actionPath = getActionAndPathById(id, floatingSequence)
		if (actionPath) {
			return {
				action: actionPath.action,
				sequence: floatingSequence,
				path: `floatingSequences[${i}].${actionPath.path}`,
			}
		}
	}
}

export function getActionByParsedPath(path: string[], automation: AutomationData): AnyAction | undefined {
	let pathClone = _cloneDeep(path)
	let sequence: Sequence

	if (pathClone[0] == "sequence") {
		sequence = automation.sequence
		pathClone = pathClone.slice(1)
	} else if (pathClone[0] == "floatingSequences") {
		sequence = automation.floatingSequences[Number(pathClone[1])]
		if (!sequence) return undefined
		pathClone = pathClone.slice(2)
	} else {
		return undefined
	}

	let action: AnyAction | ActionStack | undefined

	for (let i = 0; i < pathClone.length; ++i) {
		if (pathClone[i] == "actions") {
			action = sequence.actions[Number(pathClone[i + 1])]
			i++
		} else if (pathClone[i] == "stack") {
			if (!action || !isActionStack(action)) return action
			action = action.stack[Number(pathClone[i + 1])]
			i++
			if (!action) return undefined
		} else if (pathClone[i] == "offsets") {
			if (!action) return undefined
			if (!isTimeAction(action)) {
				if (!isActionStack(action)) return action
				return undefined
			}
			sequence = action.offsets[Number(pathClone[i + 1])]
			if (!sequence) return undefined
			i++
		} else if (pathClone[i] == "subFlows") {
			if (!action) return undefined
			if (!isFlowAction(action)) {
				if (!isActionStack(action)) return action
				return undefined
			}
			sequence = action.subFlows[Number(pathClone[i + 1])]
			i++
		} else {
			if (action && !isActionStack(action)) return action
			return undefined
		}
	}

	if (action && !isActionStack(action)) return action
	return undefined
}
