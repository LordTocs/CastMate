import { defineAction } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { TwitchAPIService, onChannelAuth } from "./api-harness"

export function setupClips() {
	defineAction({
		id: "createClip",
		name: "Create Clip",
		description: "Create's a clip",
		icon: "mdi mdi-filmstrip",
		type: "instant",
		config: {
			type: Object,
			properties: {},
		},
		result: {
			type: Object,
			properties: {
				clipId: { type: String },
			},
		},
		async invoke(config, contextData, abortSignal) {
			const clipId = await TwitchAccount.channel.apiClient.clips.createClip({
				channel: TwitchAccount.channel.twitchId,
				createAfterDelay: true,
			})
			return { clipId }
		},
	})
}
