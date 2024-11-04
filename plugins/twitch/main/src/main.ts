import {
	AnalyticsService,
	PubSubManager,
	defineAction,
	definePlugin,
	definePluginResource,
	defineResourceSetting,
	defineSatellitePlugin,
	onLoad,
	onUnload,
} from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { setupChat } from "./chat"
import { setupSubscriptions } from "./subscriptions"
import { setupChannelPointRewards, ChannelPointReward } from "./channelpoints"
import { setupPolls } from "./poll"
import { setupPredictions } from "./prediction"
import { setupAds } from "./ads"
import { setupClips } from "./clips"
import { TwitchAPIService, onBotAuth, onChannelAuth } from "./api-harness"
import { setupFollows } from "./follows"
import { setupRaids } from "./raids"
import { setupHypeTrains } from "./hype-train"
import { setupModeration } from "./moderation"
import { ViewerCache, setupViewerCache } from "./viewer-cache"
import { setupViewerGroups } from "./group"
import { setupUndocumented } from "./undocumented"
import { setupEmotes } from "./native-emotes"
import { setup7tv } from "./seventv"
import { setupCategoryCache } from "./category-cache"
import { setupInfoManager } from "./info-manager"
import { setupWalkOns } from "./walk-on"

export default definePlugin(
	{
		id: "twitch",
		name: "Twitch",
		description: "Provides Twitch triggers for chat, raids, and more",
		icon: "mdi mdi-twitch",
		color: "#9146FF", //"#5E5172",
	},
	() => {
		definePluginResource(TwitchAccount)

		onLoad(() => {
			ViewerCache.initialize()
		})

		onLoad(async () => {
			await TwitchAPIService.initialize()
		})

		defineResourceSetting(TwitchAccount, "Twitch Accounts")

		onUnload(() => {})

		onChannelAuth((channel) => {
			//Pass the auth token to the pubsub so it can auth with the CastMate servers
			PubSubManager.getInstance().setToken(channel.secrets.accessToken)

			AnalyticsService.getInstance().setUserId(channel.twitchId)

			AnalyticsService.getInstance().set({
				$first_name: channel.config.name,
				...(channel.config.email ? { $email: channel.config.email } : {}),
			})
		})

		onBotAuth((channel) => {
			AnalyticsService.getInstance().set({
				$last_name: channel.config.name,
			})
		})

		setupViewerCache()
		setupViewerGroups()
		setupCategoryCache()
		setupInfoManager()
		setupAds()
		setupChannelPointRewards()
		setupChat()
		setupClips()
		setupFollows()
		setupHypeTrains()
		setupPolls()
		setupPredictions()
		setupRaids()
		setupSubscriptions()
		setupModeration()
		setupUndocumented()
		setupEmotes()
		setup7tv()
		setupWalkOns()

		onLoad(async () => {
			await TwitchAPIService.getInstance().finalize()
		})
	}
)

const twitchSatellite = defineSatellitePlugin(
	{
		id: "twitch",
		name: "Twitch",
		description: "Provides Twitch triggers for chat, raids, and more",
		icon: "mdi mdi-twitch",
		color: "#9146FF", //"#5E5172",
	},
	() => {
		definePluginResource(TwitchAccount)

		onLoad(() => {
			ViewerCache.initialize()
		})

		onLoad(async () => {
			await TwitchAPIService.initialize()
		})

		onChannelAuth((channel) => {
			//Pass the auth token to the pubsub so it can auth with the CastMate servers
			PubSubManager.getInstance().setToken(channel.secrets.accessToken)
		})

		onLoad(async () => {
			await TwitchAPIService.getInstance().finalize()
		})
	}
)

export { TwitchAccount, onChannelAuth, ChannelPointReward, ViewerCache, twitchSatellite }
