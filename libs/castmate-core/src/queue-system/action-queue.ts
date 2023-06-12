import { RegisterResource, ResourceStorage, defineResource } from "../resources/resource"
import { Sequence } from "./sequence"
import { nanoid } from "nanoid/non-secure"

interface QueuedSequenceData<ContextData = any> {
	id: string
	context: ContextData
	sequence: Sequence
}

@RegisterResource
export class ActionQueue extends defineResource({
	config: {
		type: Object,
		properties: {
			name: { type: String, required: true, default: "" },
			paused: { type: Boolean, required: true, default: false },
		},
	},
	state: {
		type: Object,
		properties: {
			queue: {
				type: Array,
				items: {
					type: Object,
					properties: {
						id: { type: String },
						sequence: { type: Object, properties: {} },
						context: { type: Object, properties: {} },
					},
				},
				required: true,
			},
		},
	},
}) {
	static storage = new ResourceStorage<ActionQueue>()

	enqueue(context: Record<string, any>, sequence: Sequence) {
		this.state.queue.push({
			id: nanoid(),
			context,
			sequence,
		})
	}
}
