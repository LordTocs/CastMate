import { usePluginStore } from "castmate-ui-core"
import RandomFlowActionComponent from "./components/RandomFlowActionComponent.vue"

export async function initPlugin() {
	console.log("init random!")
	const pluginStore = usePluginStore()

	pluginStore.setFlowActionComponent("random", "random", RandomFlowActionComponent)
}
