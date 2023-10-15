import { ProfileConfig, ProfileState, ResourceData } from "castmate-schema"
import {
	ProfileView,
	ProjectGroup,
	ProjectItem,
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

function createProfileViewData(resource: ResourceData<ProfileConfig>) {
	return {
		scrollX: 0,
		scrollY: 0,
		triggers: resource.config.triggers.map((t) => ({
			id: t.id,
			open: false,
			height: 600,
			automationView: {
				panState: {
					zoomX: 1,
					zoomY: 1,
					panX: 0,
					panY: 0,
					panning: false,
				},
				selection: [],
			},
		})),
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

			items = resourceItems.map((r) => ({
				id: r.id,
				title: r.config.name,
				icon: `mdi mdi-card-text-outline ${r.state.active ? "active-profile-icon" : ""}`,
				open() {
					dockingStore.openDocument(r.id, r.config, createProfileViewData(r), "profile")
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
						if (!options) {
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

export async function initializeProfiles(app: App<Element>) {
	const documentStore = useDocumentStore()
	const resourceStore = useResourceStore()
	const projectStore = useProjectStore()

	documentStore.registerSaveFunction("profile", async (doc) => {
		await resourceStore.setResourceConfig("Profile", doc.id, doc.data)
	})

	projectStore.registerProjectGroupItem(createProfileGroup(app))
}
