import { useResourceStore } from "castmate-ui-core"
import "./css/icons.css"
import KasaAccountSettings from "./components/KasaAccountSettings.vue"

export function initPlugin() {
	//Init Renderer Module

	const resourceStore = useResourceStore()

	resourceStore.registerSettingComponent("KasaAccount", KasaAccountSettings)
}
