import { PluginManager } from "../plugins/plugin-manager"
import { setAbortableTimeout } from "../util/abort-utils"
import { deserializeSchema } from "../util/ipc-schema"
import { SemanticVersion } from "../util/type-helpers"

import {
	Sequence,
	ActionInfo,
	ActionStack,
	TimeAction,
	InstantAction,
	SequenceActions,
	OffsetActions,
	FlowAction,
	isActionStack,
	isTimeAction,
	isFlowAction,
} from "castmate-schema"

export interface SequenceDebugger {
	sequenceStarted(): void
	sequenceEnded(): void
	markStart(id: string): void
	markEnd(id: string): void
	logResult(id: string, result: any): void
	logError(id: string, err: any): void
}

type SequenceCompletion = "complete" | "aborted"

export class SequenceRunner {
	private abortController = new AbortController()

	constructor(private sequence: Sequence, private context: any, private dbg?: SequenceDebugger) {}

	abort() {
		this.abortController.abort()
	}

	get aborted() {
		return this.abortController.signal.aborted
	}

	async run(): Promise<SequenceCompletion> {
		this.dbg?.sequenceStarted()
		const completion = await this.runSequence(this.sequence)
		this.dbg?.sequenceEnded()
		return completion
	}

	private async runActionBase(action: ActionInfo) {
		this.dbg?.markStart(action.id)
		try {
			const actionDef = PluginManager.getInstance().getAction(action.plugin, action.action)
			if (!actionDef || actionDef.type != "regular") {
				throw new Error(`Unknown Action: ${action.plugin}:${action.action}`)
			}
			const deserializedConfig = deserializeSchema(actionDef.configSchema, action.config)
			const result = await actionDef.invoke(deserializedConfig, this.context, this.abortController.signal)
			this.dbg?.logResult(action.id, result)
			return result
		} catch (err) {
			console.error("Error ", action.plugin, action.action, err)
			this.dbg?.logError(action.id, err)
			return undefined
		} finally {
			this.dbg?.markEnd(action.id)
		}
	}

	private async runFlowAction(action: FlowAction) {
		if (this.aborted) return
		this.dbg?.markStart(action.id)
		try {
			const actionDef = PluginManager.getInstance().getAction(action.plugin, action.action)
			if (!actionDef || actionDef.type != "flow") {
				throw new Error(`Unknown Action: ${action.plugin}:${action.action}`)
			}

			const deserializedConfig = deserializeSchema(actionDef.configSchema, action.config)

			const flows: Record<string, any> = {}

			for (const flow of action.subFlows) {
				flows[flow.id] = actionDef.flowSchema ? deserializeSchema(actionDef.flowSchema, flow.config) : null
			}

			const subFlowId = await actionDef.invoke(
				deserializedConfig,
				flows,
				this.context,
				this.abortController.signal
			)

			const subFlow = action.subFlows.find((f) => f.id == subFlowId)
			if (!subFlow) throw new Error(`Chose Undefined Subflow ${subFlowId}`)

			await this.runSequence(subFlow)
		} catch (err) {
			this.dbg?.logError(action.id, err)
		} finally {
			this.dbg?.markEnd(action.id)
		}
	}

	private async runAction(action: ActionStack | TimeAction | InstantAction) {
		if (this.aborted) return
		if (isActionStack(action)) {
			return await this.runActionStack(action)
		} else if (isTimeAction(action)) {
			return await this.runTimeAction(action)
		} else if (isFlowAction(action)) {
			return await this.runFlowAction(action)
		} else {
			return await this.runActionBase(action)
		}
	}

	/**
	 * Action Stacks have all actions executed simultaneously
	 * @param actionStack
	 */
	private async runActionStack(actionStack: ActionStack) {
		const promises = actionStack.stack.map((action) => this.runActionBase(action))
		return await Promise.all(promises)
	}
	/**
	 * Sequences run actions one after another, each waiting on the prior
	 * @param sequence
	 */
	private async runSequence(sequence: SequenceActions): Promise<SequenceCompletion> {
		for (let action of sequence.actions) {
			if (this.aborted) return "aborted"
			await this.runAction(action)
		}
		return this.aborted ? "aborted" : "complete"
	}

	/**
	 * A time action can have sequences attached at different delay points
	 * @param timeAction
	 */
	private async runTimeAction(timeAction: TimeAction) {
		const actionPromise = this.runActionBase(timeAction)

		//TODO: minDuration for unknown duration

		const promises = timeAction.offsets.map(async (offset) => {
			await this.runOffset(offset)
		})

		await Promise.allSettled([actionPromise, ...promises])
	}

	private runOffset(offset: OffsetActions) {
		return new Promise((resolve, reject) => {
			setAbortableTimeout(
				async () => {
					try {
						await this.runSequence(offset)
						resolve(undefined)
					} catch (err) {
						reject(err)
					}
				},
				offset.offset * 1000,
				this.abortController.signal,
				() => {
					resolve(undefined)
				}
			)
		})
	}
}
