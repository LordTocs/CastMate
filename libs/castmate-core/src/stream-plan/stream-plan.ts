import { nanoid } from "nanoid/non-secure"
import { Sequence, StreamPlanConfig, StreamPlanState } from "castmate-schema"
import { FileResource } from "../resources/file-resource"
import { SequenceProvider } from "../profile/profile"
import { Service } from "../util/service"
import { ActionQueueManager } from "../queue-system/action-queue"
import { SequenceRunner } from "../queue-system/sequence"
import { PluginManager } from "../plugins/plugin-manager"
import { ResourceStorage } from "../resources/resource"

export class StreamPlan extends FileResource<StreamPlanConfig, StreamPlanState> implements SequenceProvider {
	static resourceDirectory: string = "./stream-plans"
	static storage = new ResourceStorage<StreamPlan>("StreamPlan")

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this._config = {
			name: name ?? "",
			activationAutomation: { sequence: { actions: [] }, floatingSequences: [], queue: undefined },
			deactivationAutomation: { sequence: { actions: [] }, floatingSequences: [], queue: undefined },
			segments: [],
		}
	}

	getSequence(id: string): Sequence | undefined {
		if (id == "activation") return this.config.activationAutomation.sequence
		if (id == "deactivation") return this.config.deactivationAutomation.sequence

		const split = id.split(".")

		const segment = this.config.segments.find((s) => s.id == split[0])
		if (segment) {
			if (split[1] == "activation") return segment.activationAutomation.sequence
			if (split[1] == "deactivation") return segment.deactivationAutomation.sequence
		}

		return undefined
	}

	private async deactivateSegment(id: string) {
		const segment = this.config.segments.find((seg) => seg.id == id)
		if (!segment) return

		const deactivationRunner = new SequenceRunner(segment.deactivationAutomation.sequence, {
			contextState: {},
		})
		await deactivationRunner.run()

		for (const componentTypeId in segment.components) {
			const component = StreamPlanComponents.getInstance().getComponentType(componentTypeId)
			if (!component) continue

			await component.onDeactivate?.(segment.id, segment.components[componentTypeId])
		}
	}

	async activateSegment(id: string) {
		const segment = this.config.segments.find((seg) => seg.id == id)
		if (!segment) return

		if (this.state.activeSegment != null) {
			await this.deactivateSegment(this.state.activeSegment)
		}

		this.state.activeSegment = segment.id

		const activationRunner = new SequenceRunner(segment.activationAutomation.sequence, {
			contextState: {},
		})
		await activationRunner.run()

		for (const componentTypeId in segment.components) {
			const component = StreamPlanComponents.getInstance().getComponentType(componentTypeId)
			if (!component) continue

			await component.onActivate?.(segment.id, segment.components[componentTypeId])
		}
	}
}

export interface StreamPlanComponent<Config = any> {
	id: string
	onActivate?(segmentId: string, config: Config): any
	onDeactivate?(segmentId: string, config: Config): any
	activeConfigChanged?(segmentId: string, config: Config): any
}

export const StreamPlanComponents = Service(
	class {
		private componentTypes = new Map<string, StreamPlanComponent>()

		registerComponentType(factory: StreamPlanComponent) {
			this.componentTypes.set(factory.id, factory)
		}

		getComponentType(id: string) {
			return this.componentTypes.get(id)
		}
	}
)

export function setupStreamPlans() {
	StreamPlanComponents.initialize()
	StreamPlan.initialize()
}
