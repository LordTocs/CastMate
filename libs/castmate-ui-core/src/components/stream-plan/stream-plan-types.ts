import { App, Component, computed, markRaw, ref } from "vue"
import {
	InlineAutomationView,
	createInlineAutomationView,
	getResourceAsProjectGroup,
	handleIpcMessage,
	useDocumentStore,
	useIpcCaller,
	useProjectStore,
	useResource,
	useResourceArray,
	useResourceData,
	useResourceStore,
} from "../../main"
import { ResourceData, StreamPlanConfig, StreamPlanState, StreamPlanSegment } from "castmate-schema"
import { defineStore } from "pinia"
import _cloneDeep from "lodash/cloneDeep"
import { StreamPlan } from "castmate-core"
import { useDialog } from "primevue"
import StreamPlanSegmentEditDialog from "./StreamPlanSegmentEditDialog.vue"

export interface StreamPlanSegmentView {
	id: string
	activationAutomation: InlineAutomationView
	deactivationAutomation: InlineAutomationView
}

export function createStreamPlanSegmentView(segment: StreamPlanSegment) {
	return {
		id: segment.id,
		activationAutomation: createInlineAutomationView(),
		deactivationAutomation: createInlineAutomationView(),
	} as StreamPlanSegmentView
}

export interface StreamPlanView {
	scrollX: number
	scrollY: number
	segments: StreamPlanSegmentView[]
	activationAutomation: InlineAutomationView
	deactivationAutomation: InlineAutomationView
}

export function initializeStreamPlans(app: App<Element>) {
	const documentStore = useDocumentStore()
	const resourceStore = useResourceStore()
	const projectStore = useProjectStore()

	documentStore.registerSaveFunction("streamplan", async (doc) => {
		const dataCopy = _cloneDeep(doc.data)
		await resourceStore.setResourceConfig("StreamPlan", doc.id, dataCopy)
	})

	projectStore.registerProjectGroupItem(
		getResourceAsProjectGroup<ResourceData<StreamPlanConfig>>(app, {
			resourceType: "StreamPlan",
			resourceName: "Stream Plan",
			documentType: "streamplan",
			groupIcon: "mdi mdi-view-agenda",
			createView(resource) {
				return {
					scrollX: 0,
					scrollY: 0,
					activationAutomation: createInlineAutomationView(),
					deactivationAutomation: createInlineAutomationView(),
					segments: resource.config.segments.map((s) => createStreamPlanSegmentView(s)),
				} as StreamPlanView
			},
		})
	)
}

const setActivePlan = useIpcCaller<(planId: string | undefined) => any>("stream-plan", "setActivePlan")
const setActiveSegment = useIpcCaller<(planId: string) => any>("stream-plan", "setActiveSegment")

export const useStreamPlanStore = defineStore("stream-plan", () => {
	const components = ref(new Map<string, Component>())
	const viewComponents = ref(new Map<string, Component>())

	async function initialize() {
		handleIpcMessage("stream-plan", "activePlanChanged", (event, planId: string | undefined) => {
			console.log("Active Plan Changed", planId)
			activePlanId.value = planId
		})
	}

	const planResources = useResourceData<ResourceData<StreamPlanConfig, StreamPlanState>>("StreamPlan")

	const activePlanId = ref<string>()
	const activePlan = computed(() => {
		if (!activePlanId.value) return undefined
		return planResources.value?.resources?.get?.(activePlanId.value)
	})
	const activeSegment = computed(() => {
		if (!activePlan.value) return undefined
		if (!activePlan.value.state.activeSegment) return undefined

		return activePlan.value.config.segments.find((s) => s.id == activePlan.value?.state?.activeSegment)
	})

	function registerStreamPlanComponent(id: string, comp: Component) {
		components.value.set(id, markRaw(comp))
	}

	function registerStreamPlanComponentView(id: string, comp: Component) {
		viewComponents.value.set(id, markRaw(comp))
	}

	return {
		initialize,
		components,
		viewComponents,
		registerStreamPlanComponent,
		registerStreamPlanComponentView,
		activePlan,
		activeSegment,
		setActivePlan,
		setActiveSegment,
	}
})

export function useSegmentEditDialog() {
	const dialog = useDialog()
	const resourceStore = useResourceStore()
	const resources = useResourceArray<ResourceData<StreamPlanConfig>>("StreamPlan")

	return (planId: string, segmentId: string) => {
		const plan = resources.value.find((r) => r.id == planId)
		if (!plan) return
		const segmentIdx = plan.config.segments.findIndex((s) => s.id == segmentId)
		if (segmentIdx < 0) return
		const segment = plan.config.segments[segmentIdx]

		return new Promise<void>((resolve, reject) => {
			dialog.open(StreamPlanSegmentEditDialog, {
				props: {
					header: `Edit ${segment.name}`,
					modal: true,
				},
				data: _cloneDeep(segment),
				async onClose(options) {
					if (!options?.data) {
						return resolve()
					}

					try {
						const dataUpdate = _cloneDeep(plan.config)
						dataUpdate.segments[segmentIdx] = options.data
						await resourceStore.setResourceConfig("StreamPlan", planId, dataUpdate)

						return resolve()
					} catch (err) {
						return resolve()
					}
				},
			})
		})
	}
}
