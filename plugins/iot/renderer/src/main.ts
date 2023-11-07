import { useDataInputStore, usePluginStore, useResourceStore } from "castmate-ui-core"
import { LightColor, dummy } from "castmate-plugin-iot-shared"
import LightColorInputVue from "./components/LightColorInput.vue"
import LightActionComponentVue from "./components/LightActionComponent.vue"
import "./css/icons.css"

export function initPlugin() {
	const inputStore = useDataInputStore()
	inputStore.registerInputComponent(LightColor, LightColorInputVue)

	const pluginStore = usePluginStore()
	pluginStore.setActionComponent("iot", "light", LightActionComponentVue)
}
