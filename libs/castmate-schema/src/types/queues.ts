import { QueuedSequence } from "./sequence"

export interface ActionQueueConfig {
	name: string
	paused: boolean
}

export interface ActionQueueState {
	running?: QueuedSequence
	queue: QueuedSequence[]
	history: QueuedSequence[]
}
