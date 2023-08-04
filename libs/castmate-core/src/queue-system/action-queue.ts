import { ResourceStorage, Resource } from "../resources/resource"
import { Sequence } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"

interface QueuedSequenceData<ContextData = any> {
	id: string
	context: ContextData
	sequence: Sequence
}

interface ActionQueueConfig {
	name: string
	paused: boolean
}

interface ActionQueueState {
	queue: any[]
}

export class ActionQueue extends Resource<ActionQueueConfig, ActionQueueState> {
	static storage = new ResourceStorage<ActionQueue>("ActionQueue")

	enqueue(context: Record<string, any>, sequence: Sequence) {
		this.state.queue.push({
			id: nanoid(),
			context,
			sequence,
		})
	}
}
