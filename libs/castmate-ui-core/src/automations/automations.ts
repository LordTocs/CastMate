import { AutomationConfig, ResourceData } from "castmate-schema"
import { App, computed, markRaw } from "vue"
import {
	AutomationView,
	ProjectGroup,
	ProjectItem,
	useDockingStore,
	useDocumentStore,
	useProjectStore,
	useResourceData,
	useResourceStore,
} from "../main"
import NameDialogVue from "../components/dialogs/NameDialog.vue"

export interface AutomationResourceView {
	automationView: AutomationView
}

export interface InlineAutomationView {
	open: boolean
	height: number
	automationView: AutomationView
}

export function createInlineAutomationView(): InlineAutomationView {
	return {
		open: false,
		height: 600,
		automationView: {
			panState: {
				zoomX: 4,
				zoomY: 1,
				panX: 0,
				panY: 0,
				panning: false,
			},
		},
	}
}

function createAutomationViewData(resource: ResourceData<AutomationConfig>): AutomationResourceView {
	return {
		automationView: {
			panState: {
				zoomX: 4,
				zoomY: 1,
				panX: 0,
				panY: 0,
				panning: false,
			},
		},
	}
}

function createAutomationGroup(app: App<Element>) {
	const resources = useResourceData<ResourceData<AutomationConfig>>("Automation")
	const resourceStore = useResourceStore()
	const dockingStore = useDockingStore()

	const group = computed<ProjectGroup>(() => {
		let items: ProjectItem[] = []

		if (resources.value) {
			const resourceItems = [...resources.value.resources.values()]

			resourceItems.sort((a, b) => a.config.name.localeCompare(b.config.name))

			items = resourceItems.map((r) => ({
				id: r.id,
				title: r.config.name,
				icon: `mdi mdi-cogs`,
				open() {
					dockingStore.openDocument(r.id, r.config, createAutomationViewData(r), "automation")
				},
				rename(name) {
					resourceStore.applyResourceConfig("Automation", r.id, { name })
				},
				delete() {
					resourceStore.deleteResource("Automation", r.id)
				},
			}))
		}

		return {
			id: "automation",
			title: "Automations",
			icon: "mdi mdi-cogs",
			items,
			create() {
				const dialog = app.config.globalProperties.$dialog
				if (!resources.value) return
				dialog.open(NameDialogVue, {
					props: {
						header: `New Automation`,
						style: {
							width: "25vw",
						},
						modal: true,
					},
					onClose(options) {
						if (!options?.data) {
							return
						}

						resourceStore.createResource("Automation", options.data)
					},
				})
			},
		}
	})

	return group
}

export function useOpenAutomationDocument() {
	const dockingStore = useDockingStore()
	const resourceStore = useResourceData<ResourceData<AutomationConfig>>("Profile")

	return (id: string) => {
		const resource = resourceStore.value?.resources?.get(id)
		if (!resource) return

		dockingStore.openDocument(resource.id, resource.config, createAutomationViewData(resource), "profile")
	}
}

export async function initializeAutomations(app: App<Element>) {
	const documentStore = useDocumentStore()
	const resourceStore = useResourceStore()
	const projectStore = useProjectStore()

	documentStore.registerSaveFunction("automation", async (doc) => {
		await resourceStore.setResourceConfig("Automation", doc.id, doc.data)
	})

	projectStore.registerProjectGroupItem(createAutomationGroup(app))
}
