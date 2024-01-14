import { ResourceStorage, Resource } from "../resources/resource"
import {
	QueuedSequence,
	Sequence,
	SequenceSource,
	ActionQueueConfig,
	ActionQueueState,
	Schema,
	constructDefault,
} from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { Service } from "../util/service"
import { SequenceDebugger, SequenceRunner } from "./sequence"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { Profile } from "../profile/profile"
import { FileResource } from "../resources/file-resource"
import { ResourceRegistry } from "../resources/resource-registry"
import { deserializeSchema, exposeSchema } from "../util/ipc-schema"
import { PluginManager } from "../plugins/plugin-manager"

export class ActionQueue extends FileResource<ActionQueueConfig, ActionQueueState> {
	static resourceDirectory: string = "./queues"
	static storage = new ResourceStorage<ActionQueue>("ActionQueue")

	private runner: SequenceRunner | null = null

	constructor(config?: ActionQueueConfig) {
		super()

		if (config) {
			this._id = nanoid()
			this._config = config
		} else {
			this._config = { name: "", paused: false }
		}

		this.state = {
			history: [],
			running: undefined,
			queue: [],
		}
	}

	get isRunning() {
		return this.runner != null
	}

	/**
	 * If a queue is paused it will finish running the current sequence, but not start a new one.
	 */
	get isPaused() {
		return this.config.paused
	}

	async setConfig(config: ActionQueueConfig): Promise<boolean> {
		const result = await super.setConfig(config)
		this.checkQueueStart()
		return result
	}

	async applyConfig(config: Partial<ActionQueueConfig>): Promise<boolean> {
		const result = await super.applyConfig(config)
		this.checkQueueStart()
		return result
	}

	//Restarts the queue processing if it needs to
	private checkQueueStart() {
		if (this.config.paused) return

		if (!this.isRunning) {
			this.runNext()
		}
	}

	enqueue(source: SequenceSource, context: Record<string, any>) {
		this.state.queue.push({
			id: nanoid(),
			queueContext: { contextState: context },
			source,
		})

		this.checkQueueStart()
	}

	private pushToHistory(qs: QueuedSequence) {
		this.state.history.unshift(qs)
		if (this.state.history.length > 20) {
			//Todo: Configurable?
			this.state.history.pop()
		}
	}

	skip(id: string) {
		if (this.state.running?.id == id) {
			this.runner?.abort()
		} else {
			const idx = this.state.queue.findIndex((i) => i.id == id)
			if (idx < 0) return
			this.state.queue.splice(idx, 1)
		}
	}

	spliceQueue(index: number, deleteCount: number, ...sequence: QueuedSequence[]) {
		this.state.queue.splice(index, deleteCount, ...sequence)
		console.log("Spliced", index, deleteCount, ...sequence)
	}

	replay(id: string) {
		const played = this.state.history.find((i) => i.id == id)
		if (!played) return

		this.enqueue(played.source, played.queueContext)
	}

	private getNextSequence():
		| { queuedSequence: QueuedSequence; sequence: Sequence; contextSchema: Schema }
		| undefined {
		let queuedSequence: QueuedSequence | undefined
		while ((queuedSequence = this.state.queue.shift())) {
			if (queuedSequence.source.type == "profile" && queuedSequence.source.subid) {
				const profile = Profile.storage.getById(queuedSequence.source.id)
				if (!profile) {
					console.log("Couldn't find profile", queuedSequence.source.id)
					continue
				}

				const sequence = profile.getSequence(queuedSequence.source.subid)
				if (!sequence) {
					console.log("Couldn't find Sequence", queuedSequence.source.subid)
					continue
				}

				const trigger = profile.getTrigger(queuedSequence.source.subid)
				if (!trigger) {
					console.log("Couldn't find trigger", queuedSequence.source.subid)
					continue
				}

				return {
					queuedSequence,
					sequence,
					contextSchema: trigger.context,
				}
			}

			//Todo: This item didn't have a sequence source
		}

		return undefined
	}

	async runNext() {
		console.log("runNext")
		if (this.runner || this.state.running) {
			return
		}

		const seqItem = this.getNextSequence()

		if (!seqItem) return

		console.log("Running SeqItem", seqItem)

		const resolvedContext = await deserializeSchema(seqItem.contextSchema, seqItem.queuedSequence.queueContext)
		const finalContext = await exposeSchema(seqItem.contextSchema, resolvedContext)

		this.runner = new SequenceRunner(seqItem.sequence, finalContext)

		this.state.running = seqItem.queuedSequence
		const doRun = async () => {
			try {
				await this.runner?.run()
			} finally {
				this.runner = null
				this.state.running = undefined
				this.pushToHistory(seqItem.queuedSequence)
				if (!this.isPaused) {
					this.runNext()
				}
			}
		}
		doRun()
	}

	static async initialize() {
		await super.initialize()

		//@ts-ignore
		ResourceRegistry.getInstance().exposeIPCFunction(ActionQueue, "skip")
		//@ts-ignore
		ResourceRegistry.getInstance().exposeIPCFunction(ActionQueue, "replay")

		//@ts-ignore
		ResourceRegistry.getInstance().exposeIPCFunction(ActionQueue, "spliceQueue")
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
		console.log("Sequence Start")
		markTestSequenceStart(this.sequenceId)
	}

	sequenceEnded() {
		console.log("Sequence End")
		markTestSequenceEnd(this.sequenceId)
	}
}

export const ActionQueueManager = Service(
	class {
		private testSequences = new Map<string, SequenceRunner>()

		constructor() {
			defineIPCFunc(
				"actionQueue",
				"runTestSequence",
				(id: string, sequence: Sequence, trigger?: { plugin: string; trigger: string }) => {
					//sequence is encoded for IPC, change configs to proper types
					this.runTestSequence(id, sequence, trigger)
					return id
				}
			)

			defineIPCFunc("actionQueue", "stopTestSequence", (id: string) => {
				return this.stopTestSequence(id)
			})
		}

		async runTestSequence(id: string, sequence: Sequence, trigger?: { plugin?: string; trigger?: string }) {
			if (this.testSequences.has(id)) return

			let context: any = {}

			if (trigger && trigger.trigger && trigger.plugin) {
				const triggerDef = PluginManager.getInstance().getTrigger(trigger.plugin, trigger.trigger)
				if (triggerDef) {
					const defaultRunValues = await constructDefault(triggerDef.context)
					//console.log("Default for test", defaultRunValues)
					const exposedDefault = await exposeSchema(triggerDef.context, defaultRunValues)
					//console.log("Exposed for test", exposedDefault)
					context = exposedDefault
				}
			}

			const runner = new SequenceRunner(
				sequence,
				{
					contextState: context,
				},
				new TestRunnerDebugger(id)
			)

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
