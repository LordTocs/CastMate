import { ResourceStorage, Resource } from "../resources/resource"
import {
	QueuedSequence,
	Sequence,
	SequenceSource,
	ActionQueueConfig,
	ActionQueueState,
	Schema,
	constructDefault,
	AutomationData,
	InlineAutomation,
	addDefaults,
	isTriggerData,
} from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { Service } from "../util/service"
import { SequenceDebugger, SequenceResolvers, SequenceRunner } from "./sequence"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { Profile } from "../profile/profile"
import { FileResource } from "../resources/file-resource"
import { ResourceRegistry } from "../resources/resource-registry"
import { deserializeSchema, exposeSchema, serializeSchema } from "../util/ipc-schema"
import { PluginManager } from "../plugins/plugin-manager"
import { usePluginLogger } from "../logging/logging"

const logger = usePluginLogger("queues")

export class ActionQueue extends FileResource<ActionQueueConfig, ActionQueueState> {
	static resourceDirectory: string = "./queues"
	static storage = new ResourceStorage<ActionQueue>("ActionQueue")

	private runner: SequenceRunner | null = null
	private lastCompletion: number | null = null
	private scheduledId: string | undefined = undefined
	private scheduler: NodeJS.Timeout | undefined = undefined

	constructor(config?: ActionQueueConfig) {
		super()

		if (config) {
			this._id = nanoid()
			this._config = config
		} else {
			this._config = { name: "", paused: false, gap: 0 }
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

	get isReady() {
		return !this.isRunning || this.scheduler == null
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

	get gap() {
		return this.config.gap ?? 0
	}

	//Restarts the queue processing if it needs to
	private checkQueueStart() {
		if (this.config.paused) return

		if (this.isReady) {
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

	private clearScheduled() {
		if (!this.scheduler) return

		this.scheduledId = undefined
		clearTimeout(this.scheduler)
		this.scheduler = undefined
	}

	skip(id: string) {
		if (this.state.running?.id == id) {
			this.runner?.abort()
		} else {
			const idx = this.state.queue.findIndex((i) => i.id == id)
			if (idx < 0) return

			if (id == this.scheduledId) {
				//Make sure to stop a scheduled
				this.clearScheduled()

				if (!this.isPaused) {
					this.runNext() //Start the next one
				}
			}
			this.state.queue.splice(idx, 1)
		}
	}

	spliceQueue(index: number, deleteCount: number, ...sequence: QueuedSequence[]) {
		this.state.queue.splice(index, deleteCount, ...sequence)
	}

	replay(id: string) {
		const played = this.state.history.find((i) => i.id == id)
		if (!played) return

		this.enqueue(played.source, played.queueContext.contextState)
	}

	private getNextSequence(): QueuedSequence | undefined {
		return this.state.queue.shift()
	}

	private async runNext() {
		if (this.runner || this.state.running) {
			return
		}

		const seqItem = this.getNextSequence()

		if (!seqItem) return

		const resolver = SequenceResolvers.getInstance().getResolver(seqItem.source.type)

		if (!resolver) return

		const automation = resolver.getAutomation(seqItem.source.id, seqItem.source.subId)
		const contextSchema = await resolver.getContextSchema(seqItem.source.id, seqItem.source.subId)
		const wrapper = resolver.getRunWrapper(seqItem.source.id, seqItem.source.subId)

		if (!automation) return
		if (!contextSchema) return

		const deserializedContext = await deserializeSchema(contextSchema, seqItem.queueContext.contextState)
		const finalContext = await exposeSchema(contextSchema, deserializedContext)

		this.runner = new SequenceRunner(automation.sequence, { contextState: finalContext })
		//Sequence Set
		this.state.running = seqItem

		const doRun = async () => {
			try {
				await wrapper(async () => await this.runner?.run(), seqItem.source)
			} finally {
				this.lastCompletion = Date.now()
				this.runner = null
				this.state.running = undefined
				this.pushToHistory(seqItem)
				if (!this.isPaused) {
					this.runNext()
				}
			}
		}

		let remaining = 0
		if (this.lastCompletion != null) {
			const now = Date.now()
			const diff = (now - this.lastCompletion) / 1000
			remaining = Math.max(0, this.gap - diff)
		}

		this.scheduler = setTimeout(() => {
			this.scheduler = undefined
			doRun()
		}, remaining * 1000)
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
			defineIPCFunc("actionQueue", "runTestSequence", (id: string, automation: AutomationData) => {
				//sequence is encoded for IPC, change configs to proper types
				this.runTestSequence(id, automation)
				return id
			})

			defineIPCFunc("actionQueue", "stopTestSequence", (id: string) => {
				return this.stopTestSequence(id)
			})
		}

		async queueOrRun(type: string, id: string, subId: string | undefined, contextData: object) {
			const resolver = SequenceResolvers.getInstance().getResolver(type)
			if (!resolver) return

			const automation = resolver.getAutomation(id, subId)
			const contextSchema = await resolver.getContextSchema(id, subId)
			logger.log("QUEUE OR RUN", type, id, subId)
			const wrapper = resolver.getRunWrapper(id, subId)

			if (!automation) return
			if (!contextSchema) return

			if (automation.queue) {
				const queue = ActionQueue.storage.getById(automation.queue)

				if (!queue) return

				queue.enqueue({ type, id, subId }, serializeSchema(contextSchema, contextData))
			} else {
				const finalContext = await exposeSchema(contextSchema, contextData)
				const sequenceRunner = new SequenceRunner(automation.sequence, {
					contextState: finalContext,
				})

				await wrapper(async () => await sequenceRunner.run(), { type, id, subId })
			}
		}

		async runTestSequence(id: string, automation: AutomationData) {
			if (this.testSequences.has(id)) return

			let context: any = {}

			if (isTriggerData(automation) && automation.plugin && automation.trigger) {
				const triggerDef = PluginManager.getInstance().getTrigger(automation.plugin, automation.trigger)
				if (triggerDef) {
					const config = await deserializeSchema(triggerDef.config, automation.config)

					let contextSchema =
						typeof triggerDef.context != "function" ? triggerDef.context : await triggerDef.context(config)
					const defaultRunValues = automation.testContext
						? await deserializeSchema(contextSchema, automation.testContext)
						: {}

					await addDefaults(contextSchema, defaultRunValues)

					const exposedDefault = await exposeSchema(contextSchema, defaultRunValues)
					context = exposedDefault
				}
			}

			const runner = new SequenceRunner(
				automation.sequence,
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
