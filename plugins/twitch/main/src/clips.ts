import { defineAction } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { TwitchAPIService, onChannelAuth } from "./api-harness"
import { Duration } from "castmate-schema"
import _clamp from "lodash/clamp"
import _round from "lodash/round"

export function setupClips() {
	defineAction({
		id: "createClip",
		name: "Create Clip",
		description: "Create's a clip",
		icon: "mdi mdi-filmstrip",
		config: {
			type: Object,
			properties: {
				title: { name: "Clip Title", type: String, template: true },
				duration: { name: "Clip Duration", type: Duration, required: true, default: 30, template: true },
			},
		},
		result: {
			type: Object,
			properties: {
				clipId: { type: String, required: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			const duration = _round(_clamp(config.duration ?? 30, 5, 60), 1)

			const clipId = await TwitchAccount.channel.apiClient.clips.createClip({
				channel: TwitchAccount.channel.twitchId,
				title: config.title,
				duration,
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
