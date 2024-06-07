import { useResourceStore } from "castmate-ui-core"
import "./css/icons.css"
import WyzeAccountSettings from "./components/WyzeAccountSettings.vue"

export function initPlugin() {
	//Init Renderer Module

	const resourceStore = useResourceStore()

	resourceStore.registerSettingComponent("WyzeAccount", WyzeAccountSettings)
}
