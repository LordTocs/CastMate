import { defineState } from "castmate-core"
import { onChannelAuth } from "./api-harness"

export function setupUndocumented() {
	const viewers = defineState("viewers", {
		type: Number,
		required: true,
		default: 0,
	})

	onChannelAuth((channel, service) => {
		service.pubsubClient.onCustomTopic(channel.twitchId, "video-playback-by-id", async (event) => {
			const data = event.data as Record<string, any>
			viewers.value = "viewers" in data ? data.viewers : 0
		})
	})
}
