import _cloneDeep from "lodash/cloneDeep"
import { ProfileConfig, ProfileState, ResourceData } from "castmate-schema"
import {
	ProfileView,
	ProjectGroup,
	ProjectItem,
	createInlineAutomationView,
	registerResourceAsProjectGroup,
	useDockingStore,
	useDocumentStore,
	useProjectStore,
	useResourceData,
	useResourceStore,
} from "../main"
import { App, computed, markRaw } from "vue"
import NameDialogVue from "../components/dialogs/NameDialog.vue"
import ProfileActivationToggle from "../components/profiles/ProfileActivationToggle.vue"

export function createProfileViewData(resource: ResourceData<ProfileConfig>) {
	return {
		scrollX: 0,
		scrollY: 0,
		triggers: resource.config.triggers.map((t) => ({
			id: t.id,
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
				selection: [],
			},
		})),
		activationAutomation: createInlineAutomationView(),
		deactivationAutomation: createInlineAutomationView(),
	} as ProfileView
}

function createProfileGroup(app: App<Element>) {
	const resources = useResourceData<ResourceData<ProfileConfig, ProfileState>>("Profile")
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
				icon: `mdi mdi-card-text-outline ${r.state.active ? "active-profile-icon" : ""}`,
				open() {
					dockingStore.openDocument(
						r.id,
						r.config,
						createProfileViewData(r),
						"profile",
						computed(
							() =>
								`mdi mdi-card-text-outline ${
									resources.value?.resources.get(r.id)?.state.active ? "active-profile-icon" : ""
								}`
						)
					)
				},
				rename(name: string) {
					resourceStore.applyResourceConfig("Profile", r.id, { name })
				},
				delete() {
					resourceStore.deleteResource("Profile", r.id)
				},
				endComponent: markRaw(ProfileActivationToggle),
			}))
		}

		return {
			id: "profile",
			title: "Profiles",
			icon: "mdi mdi-card-text-outline",
			items,
			create() {
				const dialog = app.config.globalProperties.$dialog
				if (!resources.value) return
				dialog.open(NameDialogVue, {
					props: {
						header: `New Profile`,
						style: {
							width: "25vw",
						},
						modal: true,
					},
					onClose(options) {
						if (!options?.data) {
							return
						}

						resourceStore.createResource("Profile", options.data)
					},
				})
			},
		}
	})

	return group
}

export function useOpenProfileDocument() {
	const dockingStore = useDockingStore()
	const resourceStore = useResourceData<ResourceData<ProfileConfig>>("Profile")

	return (id: string) => {
		const resource = resourceStore.value?.resources?.get(id)
		if (!resource) return

		dockingStore.openDocument(
			resource.id,
			resource.config,
			createProfileViewData(resource),
			"profile",
			() => `mdi mdi-card-text-outline ${resource.state.active ? "active-profile-icon" : ""}`
		)
	}
}

export async function initializeProfiles(app: App<Element>) {
	const documentStore = useDocumentStore()
	const resourceStore = useResourceStore()
	const projectStore = useProjectStore()

	documentStore.registerSaveFunction("profile", async (doc) => {
		const docDataCopy = _cloneDeep(doc.data)

		delete docDataCopy.activationMode
		delete docDataCopy.name

		await resourceStore.applyResourceConfig("Profile", doc.id, docDataCopy)
	})

	projectStore.registerProjectGroupItem(createProfileGroup(app))
}
