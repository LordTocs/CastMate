import { defineAction, definePlugin, onLoad, onUnload } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { setupChat } from "./chat"
import { setupSubscriptions } from "./subscriptions"
import { setupChannelPointRewards } from "./channelpoints"
import { setupPolls } from "./poll"
import { setupPredictions } from "./prediction"
import { setupAds } from "./ads"
import { setupClips } from "./clips"
import { TwitchAPIService } from "./api-harness"
import { setupFollows } from "./follows"
import { setupRaids } from "./raids"
import { setupHypeTrains } from "./hype-train"

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
			console.log("Initializing")
			await TwitchAccount.initialize()

			await TwitchAPIService.initialize()
		})

		onUnload(() => {})

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

		onLoad(async () => {
			await TwitchAPIService.getInstance().finalize()
		})
	}
)
