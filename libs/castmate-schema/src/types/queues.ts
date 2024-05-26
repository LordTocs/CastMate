import { Duration } from "../data/duration"
import { QueuedSequence } from "./sequence"

export interface ActionQueueConfig {
	name: string
	paused: boolean
	gap: Duration
}

export interface ActionQueueState {
	running?: QueuedSequence
	queue: QueuedSequence[]
	history: QueuedSequence[]
}
