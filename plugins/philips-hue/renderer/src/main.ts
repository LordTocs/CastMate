import { usePluginStore } from "castmate-ui-core"
import HueHubSearch from "./components/HueHubSearch.vue"
import "./css/icons.css"

export function initPlugin() {
	//Init Renderer Module
	const pluginStore = usePluginStore()

	pluginStore.setSettingComponent("philips-hue", "hubSearch", HueHubSearch)
}
