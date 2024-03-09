import { App, Component, computed, markRaw, ref } from "vue"
import {
	InlineAutomationView,
	createInlineAutomationView,
	getResourceAsProjectGroup,
	handleIpcMessage,
	useDocumentStore,
	useIpcCaller,
	useProjectStore,
	useResourceData,
	useResourceStore,
} from "../../main"
import { ResourceData, StreamPlanConfig, StreamPlanState } from "castmate-schema"
import { defineStore } from "pinia"

export interface StreamPlanSegmentView {
	id: string
	activationAutomation: InlineAutomationView
	deactivationAutomation: InlineAutomationView
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
		await resourceStore.setResourceConfig("StreamPlan", doc.id, doc.data)
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
					segments: resource.config.segments.map((s) => ({
						id: s.id,
						activationAutomation: createInlineAutomationView(),
						deactivationAutomation: createInlineAutomationView(),
					})),
				} as StreamPlanView
			},
		})
	)
}

const setActivePlan = useIpcCaller<(planId: string | undefined) => any>("stream-plan", "setActivePlan")
const setActiveSegment = useIpcCaller<(planId: string) => any>("stream-plan", "setActiveSegment")

export const useStreamPlanStore = defineStore("stream-plan", () => {
	const components = ref(new Map<string, Component>())

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

	return {
		initialize,
		components,
		registerStreamPlanComponent,
		activePlan,
		activeSegment,
		setActivePlan,
		setActiveSegment,
	}
})
