import { setAbortableTimeout } from "../util/abort-utils"
import { SemanticVersion } from "../util/type-helpers"

export interface Sequence extends SequenceActions {}

interface ActionInfo {
	id: string
	plugin: string
	action: string
	version: SemanticVersion
	config: any
}

interface InstantAction extends ActionInfo {}

interface TimeAction extends ActionInfo {
	offsets: OffsetActions[]
}

interface ActionStack {
	id: string
	stack: InstantAction[]
}

interface SequenceActions {
	actions: (InstantAction | TimeAction | ActionStack)[]
}

interface OffsetActions extends SequenceActions {
	id: string
	offset: number
}

interface SequenceDebugger {
	markStart(id: string): void
	markEnd(id: string): void
	logError(err: any): void
}

class SequenceRunner {
	private abortController = new AbortController()

	constructor(
		private sequence: Sequence,
		private context: any,
		private dbg?: SequenceDebugger
	) {}

	abort() {
		this.abortController.abort()
	}

	async run() {
		console.log(this.context)
		await this.runSequence(this.sequence)
	}

	private async runActionBase(action: ActionInfo) {
		this.dbg?.markStart(action.id)
		try {
			//EXECUTE ACTION HERE
		} catch (err) {
			this.dbg?.logError(err)
			throw err
		} finally {
			this.dbg?.markEnd(action.id)
		}
	}

	private async runAction(action: ActionStack | TimeAction | InstantAction) {
		if ("stack" in action) {
			const actionStack = action as ActionStack
			return await this.runActionStack(actionStack)
		} else if ("offsets" in action) {
			const timeAction = action as TimeAction
			return await this.runTimeAction(timeAction)
		} else {
			return await this.runActionBase(action)
		}
	}

	/**
	 * Action Stacks have all actions executed simultaneously
	 * @param actionStack
	 */
	private async runActionStack(actionStack: ActionStack) {
		const promises = actionStack.stack.map(async (action) => {
			try {
				return await this.runActionBase(action)
			} catch (err) {
				//TODO: Handle ERROR
				return null
			}
		})

		const results = await Promise.all(promises)
	}
	/**
	 * Sequences run actions one after another, each waiting on the prior
	 * @param sequence
	 */
	private async runSequence(sequence: SequenceActions) {
		for (let action of sequence.actions) {
			await this.runAction(action)
		}
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

		await Promise.all([actionPromise, ...promises])
	}

	private runOffset(offset: OffsetActions) {
		return new Promise((resolve, reject) => {
			setAbortableTimeout(
				async () => {
					try {
						const result = await this.runSequence(offset)
						resolve(result)
					} catch (err) {
						reject(err)
					}
				},
				offset.offset * 1000,
				this.abortController.signal,
				() => {
					reject(new Error("Aborted")) //TODO: Use a special error?
				}
			)
		})
	}
}
/*
const s = new SequenceRunner(
	{
		actions: [
			{
				id: "hello",
				plugin: "twitch",
				action: "chat",
				version: "0.1.0",
				config: {
					message: "YO!",
				},
			},
			{
				id: "hello",
				plugin: "castmate",
				action: "delay",
				version: "0.1.0",
				config: {
					duration: 3.5,
				},
				offsets: [
					{
						id: "hello",
						offset: 1.75,
						actions: [
							{
								id: "hello",
								plugin: "sounds",
								action: "sound",
								version: "0.1.0",
								config: {
									sound: "Blarga.wav",
									device: "ABC-Sound-Device",
								},
							},
							{
								id: "hello",
								stack: [
									{
										id: "hello",
										plugin: "sounds",
										action: "sound",
										version: "0.1.0",
										config: {
											sound: "Blarga.wav",
											device: "ABC-Sound-Device",
										},
									},
									{
										id: "hello",
										plugin: "sounds",
										action: "sound",
										version: "0.1.0",
										config: {
											sound: "Blarga.wav",
											device: "ABC-Sound-Device",
										},
									},
								],
							},
						],
					},
				],
			},
		],
	},
	{}
)*/
