import { defineAction } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { TwitchAPIService, onChannelAuth } from "./api-harness"

export function setupClips() {
	defineAction({
		id: "createClip",
		name: "Create Clip",
		description: "Create's a clip",
		icon: "mdi mdi-filmstrip",
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

	defineAction({
		id: "streamMarker",
		name: "Place Stream Marker",
		description: "Places a marker in the stream for use in the video editor",
		icon: "mdi mdi-map-marker-star",
		config: {
			type: Object,
			properties: {
				markerName: { type: String, name: "Marker Name", template: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await TwitchAccount.channel.apiClient.streams.createStreamMarker(
				TwitchAccount.channel.twitchId,
				config.markerName
			)
		},
	})
}
