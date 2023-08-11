import { registerResourceAsProjectGroup } from "../main"
import { App } from "vue"

export async function initializeProfiles(app: App<Element>) {
	registerResourceAsProjectGroup(app, "Profile", "profile", "mdi mdi-card-text-outline")
}
