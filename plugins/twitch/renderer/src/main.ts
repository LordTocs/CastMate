import "./css/icons.css"
import {
	ProjectGroup,
	getResourceAsProjectGroup,
	useDataInputStore,
	useDockingStore,
	useProjectStore,
} from "castmate-ui-core"
import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import TwitchViewerGroupInput from "./components/TwitchViewerGroupInput.vue"
import { computed } from "vue"
import ChannelPointsEditPageVue from "./components/channel-points/ChannelPointsEditPage.vue"

export async function initPlugin() {
	console.log("Registering", TwitchViewerGroup, "TwitchViewerGroup")
	const dataStore = useDataInputStore()
	dataStore.registerInputComponent(TwitchViewerGroup, TwitchViewerGroupInput)

	const projectStore = useProjectStore()
	const dockingStore = useDockingStore()
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
						open() {
							dockingStore.openPage(
								"twitch.channelpoints",
								"Channel Point Rewards",
								ChannelPointsEditPageVue
							)
						},
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
