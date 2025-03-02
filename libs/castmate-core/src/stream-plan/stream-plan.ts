import { nanoid } from "nanoid/non-secure"
import { Sequence, StreamPlanConfig, StreamPlanState, SequenceProvider } from "castmate-schema"
import { FileResource } from "../resources/file-resource"
import { Service } from "../util/service"
import { ActionQueueManager } from "../queue-system/action-queue"
import { SequenceResolvers, SequenceRunner } from "../queue-system/sequence"
import { PluginManager } from "../plugins/plugin-manager"
import { ResourceStorage } from "../resources/resource"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { usePluginLogger } from "../logging/logging"
import { AnalyticsService } from "../analytics/analytics-manager"

const logger = usePluginLogger("streamplan")

export class StreamPlan extends FileResource<StreamPlanConfig, StreamPlanState> {
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

		this.state = {
			active: false,
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

		for (const componentTypeId in segment.components) {
			const component = StreamPlanManager.getInstance().getComponentType(componentTypeId)
			if (!component) continue

			await component.onDeactivate?.(segment.id, segment.components[componentTypeId])
		}

		await ActionQueueManager.getInstance().queueOrRun("stream-plan", this.id, `${segment.id}.deactivation`, {})
	}

	async activateSegment(id: string) {
		const segment = this.config.segments.find((seg) => seg.id == id)
		if (!segment) return

		if (this.state.activeSegment != null) {
			await this.deactivateSegment(this.state.activeSegment)
		}

		AnalyticsService.getInstance().track("startStreamSegment", {
			name: segment.name,
			hasStreamInfo: !!segment.components["twitch-stream-info"],
		})

		this.state.activeSegment = segment.id

		logger.log("Activating Segment", id)
		for (const componentTypeId in segment.components) {
			const component = StreamPlanManager.getInstance().getComponentType(componentTypeId)
			if (!component) continue

			await component.onActivate?.(segment.id, segment.components[componentTypeId])
		}

		await ActionQueueManager.getInstance().queueOrRun("stream-plan", this.id, `${segment.id}.activation`, {})
	}

	async activate() {
		if (this.state.active) return

		AnalyticsService.getInstance().track("startStreamPlan", {
			name: this.config.name,
		})

		await ActionQueueManager.getInstance().queueOrRun("stream-plan", this.id, `activation`, {})

		const segment = this.config.segments[0]
		if (!segment) return

		await this.activateSegment(segment.id)

		this.state.active = true
	}

	async deactivate() {
		if (!this.state.active) return

		AnalyticsService.getInstance().track("endStreamPlan", {
			name: this.config.name,
		})

		if (this.state.activeSegment) {
			await this.deactivateSegment(this.state.activeSegment)
			this.state.activeSegment = undefined
		}

		await ActionQueueManager.getInstance().queueOrRun("stream-plan", this.id, `deactivation`, {})

		this.state.active = false
	}
}

export interface StreamPlanComponent<Config = any> {
	id: string
	onActivate?(segmentId: string, config: Config): any
	onDeactivate?(segmentId: string, config: Config): any
	activeConfigChanged?(segmentId: string, config: Config): any
}

const activePlanChanged = defineCallableIPC<(planId: string | undefined) => any>("stream-plan", "activePlanChanged")

export const StreamPlanManager = Service(
	class {
		private componentTypes = new Map<string, StreamPlanComponent>()
		private activePlanId: string | undefined = undefined

		async initialize() {
			defineIPCFunc("stream-plan", "setActivePlan", async (planId: string | undefined) => {
				const plan = planId ? StreamPlan.storage.getById(planId) : undefined
				await this.setActivePlan(plan)
			})

			defineIPCFunc("stream-plan", "setActiveSegment", async (segmentId: string) => {
				const plan = this.activePlanId ? StreamPlan.storage.getById(this.activePlanId) : undefined
				if (!plan) return

				await plan.activateSegment(segmentId)
			})
		}

		get activePlan() {
			return this.activePlanId ? StreamPlan.storage.getById(this.activePlanId) : undefined
		}

		async startNextSegment() {
			const plan = this.activePlan
			if (plan == null) return

			const activeSegmentId = plan.state.activeSegment
			if (!activeSegmentId) return

			const idx = plan.config.segments.findIndex((s) => s.id == activeSegmentId)
			if (idx < 0) return

			const nextSegmentId = plan.config.segments[idx + 1]?.id

			if (nextSegmentId == null) return

			await plan.activateSegment(nextSegmentId)
		}

		async startPrevSegment() {
			const plan = this.activePlan
			if (plan == null) return

			const activeSegmentId = plan.state.activeSegment
			if (!activeSegmentId) return

			const idx = plan.config.segments.findIndex((s) => s.id == activeSegmentId)
			if (idx < 0) return

			const nextSegmentId = plan.config.segments[idx - 1]?.id

			if (nextSegmentId == null) return

			await plan.activateSegment(nextSegmentId)
		}

		registerComponentType(factory: StreamPlanComponent) {
			this.componentTypes.set(factory.id, factory)
		}

		getComponentType(id: string) {
			return this.componentTypes.get(id)
		}

		async setActivePlan(plan?: StreamPlan) {
			if (this.activePlanId == plan?.id) {
				//Plan's not changing, no-op
				return
			}

			if (this.activePlanId) {
				const plan = StreamPlan.storage.getById(this.activePlanId)
				await plan?.deactivate()
			}

			if (!plan) {
				this.activePlanId = undefined
				await activePlanChanged(this.activePlanId)
				logger.log("StreamPlan Stopped")
			} else {
				this.activePlanId = plan.id
				await activePlanChanged(this.activePlanId)
				logger.log("StreamPlan Started", plan.config.name)

				await plan.activate()
			}
		}
	}
)

export function setupStreamPlans() {
	StreamPlanManager.initialize()

	StreamPlanManager.getInstance().initialize()

	SequenceResolvers.getInstance().registerResolver("stream-plan", {
		getAutomation(id, subId) {
			const plan = StreamPlan.storage.getById(id)
			if (!plan) return undefined

			if (subId == "activation") return plan.config.activationAutomation
			if (subId == "deactivation") return plan.config.deactivationAutomation
			if (!subId) return

			const split = subId.split(".")

			const segment = plan.config.segments.find((s) => s.id == split[0])
			if (segment) {
				logger.log("Found Segment", segment.id)
				if (split[1] == "activation") return segment.activationAutomation
				if (split[1] == "deactivation") return segment.deactivationAutomation
			} else {
				logger.log("Can't find segment!", split[0])
			}

			return undefined
		},
		async getContextSchema(id, subId) {
			return { type: Object, properties: {} }
		},
		getRunWrapper(id, subId) {
			return (inner) => inner()
		},
	})
}

export async function finishSettingUpStreamPlans() {
	await StreamPlan.initialize()
}
