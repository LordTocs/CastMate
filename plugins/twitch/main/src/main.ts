import { PubSubManager, defineAction, definePlugin, defineResourceSetting, onLoad, onUnload } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { setupChat } from "./chat"
import { setupSubscriptions } from "./subscriptions"
import { setupChannelPointRewards } from "./channelpoints"
import { setupPolls } from "./poll"
import { setupPredictions } from "./prediction"
import { setupAds } from "./ads"
import { setupClips } from "./clips"
import { TwitchAPIService, onChannelAuth } from "./api-harness"
import { setupFollows } from "./follows"
import { setupRaids } from "./raids"
import { setupHypeTrains } from "./hype-train"
import { setupModeration } from "./moderation"
import { setupViewerCache } from "./viewer-cache"
import { setupViewerGroups } from "./group"
import { setupUndocumented } from "./undocumented"
import { EmoteSet, createEmoteTrie, parseEmotesRegex, parseEmotesTrie } from "castmate-plugin-twitch-shared"
import { setupEmotes } from "./emote-cache"
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
		onLoad(async () => {
			await TwitchAccount.initialize()

			await TwitchAPIService.initialize()
		})

		defineResourceSetting(TwitchAccount, "Twitch Accounts")

		onUnload(() => {})

		onChannelAuth((channel) => {
			//Pass the auth token to the pubsub so it can auth with the CastMate servers
			PubSubManager.getInstance().setToken(channel.secrets.accessToken)
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

export { TwitchAccount, onChannelAuth }
