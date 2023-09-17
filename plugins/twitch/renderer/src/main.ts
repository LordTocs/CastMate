import "./css/icons.css"
import { ProjectGroup, getResourceAsProjectGroup, useDataInputStore, useProjectStore } from "castmate-ui-core"
import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import TwitchViewerGroupInput from "./components/TwitchViewerGroupInput.vue"
import { computed } from "vue"

export async function initPlugin() {
	console.log("Registering", TwitchViewerGroup, "TwitchViewerGroup")
	const dataStore = useDataInputStore()
	dataStore.registerInputComponent(TwitchViewerGroup, TwitchViewerGroupInput)

	const projectStore = useProjectStore()

	projectStore.registerProjectGroupItem(
		computed<ProjectGroup>(() => {
			return {
				id: "twitch",
				title: "Twitch",
				icon: "mdi mdi-twitch twitch-purple",
				items: [
					{
						id: "twitch.channelpoints",
						title: "Channel Point Rewards",
						icon: "twi twi-channel-points",
						open() {},
					},
					{
						id: "twitch.groups",
						title: "Viewer Groups",
						icon: "mdi mdi-account-group",
						open() {},
					},
				],
			}
		})
	)
}
