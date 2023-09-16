import "./css/icons.css"
import { useDataInputStore } from "castmate-ui-core"
import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import TwitchViewerGroupInput from "./components/TwitchViewerGroupInput.vue"

export async function initPlugin() {
	console.log("Registering", TwitchViewerGroup, "TwitchViewerGroup")
	const dataStore = useDataInputStore()
	dataStore.registerInputComponent(TwitchViewerGroup, TwitchViewerGroupInput)
}
