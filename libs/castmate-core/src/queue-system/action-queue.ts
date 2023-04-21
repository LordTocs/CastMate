import { Sequence } from "./sequence"

interface QueuedSequenceData<ContextData = any> {
	context: ContextData
	sequence: Sequence
}

class ActionQueue {
	private queue: QueuedSequenceData[]

	enqueue(data: QueuedSequenceData) {}
}
