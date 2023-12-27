import "./css/icons.css"
import {
	ProjectGroup,
	ResourceSchemaEdit,
	getResourceAsProjectGroup,
	useDataInputStore,
	useDockingStore,
	usePluginStore,
	useProjectStore,
	useResourceStore,
} from "castmate-ui-core"
import { TwitchViewer, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import TwitchViewerGroupInput from "./components/TwitchViewerGroupInput.vue"
import { computed } from "vue"
import ChannelPointsEditPageVue from "./components/channel-points/ChannelPointsEditPage.vue"
import TwitchAccountSettingsVue from "./components/account/TwitchAccountSettings.vue"
import { Color, Duration } from "castmate-schema"
import TwitchViewerInputVue from "./components/viewer/TwitchViewerInput.vue"

export async function initPlugin() {
	console.log("Registering", TwitchViewerGroup, "TwitchViewerGroup")
	const dataStore = useDataInputStore()
	dataStore.registerInputComponent(TwitchViewerGroup, TwitchViewerGroupInput)

	dataStore.registerInputComponent(TwitchViewer, TwitchViewerInputVue)

	const resourceStore = useResourceStore()
	resourceStore.registerSettingComponent("TwitchAccount", TwitchAccountSettingsVue)

	resourceStore.registerConfigSchema("ChannelPointReward", {
		type: Object,
		properties: {
			name: { type: String, required: true, template: true, name: "Title" },
			allowEnable: { type: Boolean, required: true, default: true, name: "Enabled" },
			rewardData: {
				type: Object,
				properties: {
					prompt: { type: String, name: "Prompt", template: true },
					backgroundColor: { type: Color, name: "Color", template: true },
					userInputRequired: { type: Boolean, name: "Require User Input" },
					cost: { type: Number, name: "Cost", template: true, min: 1, default: 1, required: true },
					cooldown: { type: Duration, name: "Cooldown", template: true },
					maxRedemptionsPerStream: { type: Number, name: "Max Redemptions Per Stream", template: true },
					maxRedemptionsPerUserPerStream: { type: Number, name: "Max Redemptions Per User Per Stream" },
					skipQueue: { type: Boolean, name: "Skip Queue", required: true, default: false },
				},
			},
		},
	})
	resourceStore.registerEditComponent("ChannelPointReward", ResourceSchemaEdit)
	resourceStore.registerCreateComponent("ChannelPointReward", ResourceSchemaEdit)

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
