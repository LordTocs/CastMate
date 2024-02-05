import { AutomationData } from "./profile"
import { ActionStack, AnyAction, Sequence, getActionById } from "./sequence"

export interface AutomationConfig extends AutomationData {
	name: string
}

export interface InlineAutomation extends AutomationData {
	queue: string | undefined
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
): { action: AnyAction | ActionStack; sequence: Sequence } | undefined {
	let action: AnyAction | ActionStack | undefined = undefined

	action = getActionById(id, automation.sequence)
	if (action) {
		return { action, sequence: automation.sequence }
	}

	for (const floatingSequence of automation.floatingSequences) {
		action = getActionById(id, floatingSequence)
		if (action) {
			return { action, sequence: floatingSequence }
		}
	}
}
