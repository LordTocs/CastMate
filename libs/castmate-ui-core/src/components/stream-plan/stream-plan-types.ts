import { App, Component, markRaw, ref } from "vue"
import { getResourceAsProjectGroup, useDocumentStore, useProjectStore, useResourceStore } from "../../main"
import { ResourceData, StreamPlanConfig } from "castmate-schema"
import { defineStore } from "pinia"

export interface StreamPlanSegmentView {
	id: string
}

export interface StreamPlanView {
	scrollX: number
	scrollY: number
	segments: StreamPlanSegmentView[]
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
					segments: resource.config.segments.map((s) => ({
						id: s.id,
					})),
				} as StreamPlanView
			},
		})
	)
}

export const useStreamPlanStore = defineStore("stream-plan", () => {
	const components = ref(new Map<string, Component>())

	function registerStreamPlanComponent(id: string, comp: Component) {
		components.value.set(id, markRaw(comp))
	}

	return {
		components,
		registerStreamPlanComponent,
	}
})
