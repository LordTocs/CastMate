import { defineAction } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { CommercialLength } from "@twurple/api"

export function setupAds() {
	defineAction({
		id: "runAd",
		name: "Run Ad",
		description: "Run an Ad. You should probably use the ad manager instead.",
		icon: "mdi mdi-advertisements",
		duration: {
			propDependencies: "duration",
			async callback(config) {
				return {
					dragType: "fixed",
					duration: config.duration,
				}
			},
		},
		config: {
			type: Object,
			properties: {
				duration: { type: Number, name: "Duration", required: true, enum: [30, 60, 90, 120, 150, 180] },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await TwitchAccount.channel.apiClient.channels.startChannelCommercial(
				TwitchAccount.channel.config.twitchId,
				config.duration as CommercialLength
			)
		},
	})
}
