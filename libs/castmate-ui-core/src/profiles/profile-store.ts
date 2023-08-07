import { useDialog } from "primevue/usedialog"
import { computed, toRaw } from "vue"
import { ProjectItem, useProjectStore, useResource, useResourceStore } from "../main"
import { ProfileData } from "castmate-schema"
import NameDialog from "../components/dialogs/NameDialog.vue"
import { App } from "vue"

export async function initializeProfiles(app: App<Element>) {
	const projectStore = useProjectStore()
	const profiles = useResource("Profile")
	const resourceStore = useResourceStore()

	projectStore.registerProjectGroupItem(
		computed(() => {
			const items: ProjectItem[] = profiles.value
				? [...profiles.value?.resources.values()].map((p) => ({
						id: p.id,
						title: (p.config as ProfileData).name,
						icon: "mdi mdi-card-account-details-outline",
				  }))
				: []

			return {
				id: "profiles",
				title: "Profiles",
				icon: "mdi mdi-card-account-details-outline",
				items,
				create: toRaw(() => {
					const dialog = app.config.globalProperties.$dialog
					const instance = dialog.open(NameDialog, {
						props: {
							header: "New Profile",
							style: {
								width: "25vw",
							},
							modal: true,
						},
						onClose(options) {
							if (!options) {
								return
							}

							const profileName = options.data.name as string

							console.log("Creating Profile", profileName)
							resourceStore.createResource("Profile", profileName)
						},
					})
				}),
			}
		})
	)
}
