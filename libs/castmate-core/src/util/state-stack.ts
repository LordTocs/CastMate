import { nanoid } from "nanoid/non-secure"
import { EventList } from "./events"

interface StateStackEntry<T> {
	value: T
	id: string
}

/**
 * The state stack is more like a jenga tower, states can be put on the stack, but then removed in any order by id.
 * The top of the stack can be monitored to update the state of something. This is useful for "state over time" actions
 * For example multiple actions might request a light to change color, but end at different times removing themselves from the middle of the stack.
 * The light should be the color of whatever's on top of the stack. Eventually returning to the color it was before any were added.
 */
export class StateStack<T> {
	private states: StateStackEntry<T>[] = []

	readonly topChanged = new EventList<(state: T) => any>()

	constructor(private baseState: T) {}

	pushState(state: T) {
		const newEntry: StateStackEntry<T> = {
			id: nanoid(),
			value: state,
		}

		this.states.push(newEntry)

		this.topChanged.run(this.states[this.states.length - 1].value)

		return newEntry.id
	}

	popState(id: string) {
		const idx = this.states.findIndex((s) => s.id == id)
		if (idx < 0) return

		const topId = this.states[this.states.length - 1]?.id
		this.states.splice(idx, 1)
		const newTopId = this.states[this.states.length - 1]?.id

		if (topId != newTopId) {
			if (this.states.length > 0) {
				this.topChanged.run(this.states[this.states.length - 1].value)
			} else {
				this.topChanged.run(this.baseState)
			}
		}
	}

	get length() {
		return this.states.length
	}

	setBaseState(state: T) {
		this.baseState = state
	}
}
