import { useStreamPlanStore } from "./../../../../libs/castmate-ui-core/src/components/stream-plan/stream-plan-types"
import "./css/icons.css"
import {
	ProjectGroup,
	ResourceSchemaEdit,
	getResourceAsDirectProjectGroup,
	useDataInputStore,
	useDockingStore,
	usePluginStore,
	useProjectStore,
	useResourceStore,
} from "castmate-ui-core"
import {
	TwitchViewer,
	TwitchViewerGroup,
	TwitchCategory,
	ChannelPointRewardConfig,
} from "castmate-plugin-twitch-shared"
import TwitchViewerGroupInput from "./components/TwitchViewerGroupInput.vue"
import { computed, App } from "vue"
import ChannelPointsEditPageVue from "./components/channel-points/ChannelPointsEditPage.vue"
import TwitchAccountSettingsVue from "./components/account/TwitchAccountSettings.vue"
import { Color, Duration, ResourceData } from "castmate-schema"
import TwitchViewerInputVue from "./components/viewer/TwitchViewerInput.vue"
import GroupPageVue from "./components/groups/GroupPage.vue"
import TwitchCategoryInputVue from "./components/category/TwitchCategoryInput.vue"
import { useCategoryStore } from "./util/category"
import StreamInfoPlanComponentVue from "./components/stream-info/StreamInfoPlanComponent.vue"
import TwitchCategoryViewVue from "./components/category/TwitchCategoryView.vue"
import TwitchViewerViewVue from "./components/viewer/TwitchViewerView.vue"
import ChannelPointGroupHeaderVue from "./components/channel-points/ChannelPointGroupHeader.vue"

export { default as StreamInfoDashboardCard } from "./components/stream-info/StreamInfoDashboardCard.vue"

export async function initPlugin(app: App<Element>) {
	console.log("Registering", TwitchViewerGroup, "TwitchViewerGroup")
	const dataStore = useDataInputStore()
	dataStore.registerInputComponent(TwitchViewerGroup, TwitchViewerGroupInput)

	dataStore.registerInputComponent(TwitchViewer, TwitchViewerInputVue)
	dataStore.registerViewComponent(TwitchViewer, TwitchViewerViewVue)

	dataStore.registerInputComponent(TwitchCategory, TwitchCategoryInputVue)
	dataStore.registerViewComponent(TwitchCategory, TwitchCategoryViewVue)

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

	resourceStore.groupResourceItems("ChannelPointReward", "controllable", ChannelPointGroupHeaderVue)
	resourceStore.sortResourceItems<ResourceData<ChannelPointRewardConfig>>("ChannelPointReward", (a, b) => {
		if (a.config.controllable == b.config.controllable) return 0
		if (a.config.controllable) return -1
		return 1
	})

	const projectStore = useProjectStore()
	const dockingStore = useDockingStore()
	const categoryStore = useCategoryStore()
	categoryStore.initialize()

	// const g = getResourceAsDirectProjectGroup(app, {
	// 	resourceType: "CustomTwitchViewerGroup",
	// 	resourceName: "Viewer Groups",
	// 	groupIcon: "mdi mdi-account-group",
	// 	page: GroupPageVue,
	// }),

	const g = getResourceAsDirectProjectGroup(app, {
		resourceType: "CustomTwitchViewerGroup",
		resourceName: "Viewer Groups",
		groupIcon: "mdi mdi-account-group",
		//@ts-ignore
		page: GroupPageVue,
	})

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
					g.value,
				],
			}
		})
	)

	const streamPlanStore = useStreamPlanStore()
	streamPlanStore.registerStreamPlanComponent("twitch-stream-info", StreamInfoPlanComponentVue)
}
