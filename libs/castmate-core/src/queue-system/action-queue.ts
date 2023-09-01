import { ResourceStorage, Resource } from "../resources/resource"
import { Sequence } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { Service } from "../util/service"
import { SequenceDebugger, SequenceRunner } from "./sequence"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"

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

const markTestActionStart = defineCallableIPC<(sequenceId: string, id: string) => void>(
	"actionQueue",
	"markTestActionStart"
)
const markTestActionEnd = defineCallableIPC<(sequenceId: string, id: string) => void>(
	"actionQueue",
	"markTestActionEnd"
)
const markTestSequenceStart = defineCallableIPC<(sequenceId: string) => void>("actionQueue", "markTestSequenceStart")
const markTestSequenceEnd = defineCallableIPC<(sequenceId: string) => void>("actionQueue", "markTestSequenceEnd")

class TestRunnerDebugger implements SequenceDebugger {
	constructor(private sequenceId: string) {}

	markStart(id: string) {
		markTestActionStart(this.sequenceId, id)
	}

	markEnd(id: string) {
		markTestActionEnd(this.sequenceId, id)
	}
	logResult(id: string, result: any) {
		//TODO
	}
	logError(id: string, err: any) {
		//TODO
	}

	sequenceStarted() {
		markTestSequenceStart(this.sequenceId)
	}

	sequenceEnded() {
		markTestSequenceEnd(this.sequenceId)
	}
}

export const ActionQueueManager = Service(
	class {
		private testSequences = new Map<string, SequenceRunner>()

		constructor() {
			defineIPCFunc("actionQueue", "runTestSequence", (id: string, sequence: Sequence, context: any) => {
				//sequence is encoded for IPC, change configs to proper types
				this.runTestSequence(id, sequence, context)
				return id
			})

			defineIPCFunc("actionQueue", "stopTestSequence", (id: string) => {
				return this.stopTestSequence(id)
			})
		}

		runTestSequence(id: string, sequence: Sequence, context: any) {
			if (this.testSequences.has(id)) return

			const runner = new SequenceRunner(sequence, context, new TestRunnerDebugger(id))

			this.testSequences.set(id, runner)

			const runnerComplete = () => {
				this.testSequences.delete(id)
			}

			runner.run().then(runnerComplete).catch(runnerComplete)
		}

		stopTestSequence(id: string) {
			const runner = this.testSequences.get(id)
			if (!runner) return false

			runner.abort()
			return true
		}
	}
)
