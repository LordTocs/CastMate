import { ProfileData, ResourceData } from "castmate-schema"
import { ProfileView, registerResourceAsProjectGroup } from "../main"
import { App } from "vue"

export async function initializeProfiles(app: App<Element>) {
	registerResourceAsProjectGroup(app, {
		resourceType: "Profile",
		documentType: "profile",
		groupIcon: "mdi mdi-card-text-outline",
		createView: (resource: ResourceData<ProfileData>) => {
			return {
				scrollX: 0,
				scrollY: 0,
				triggers: resource.config.triggers.map((t) => ({
					id: t.id,
					open: false,
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
		},
	})
}
