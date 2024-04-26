import { defineAction } from "castmate-core"
import { onChannelAuth } from "./api-harness"
import { TwitchAccount } from "./twitch-auth"
import { ViewerCache } from "./viewer-cache"
import { TwitchViewer } from "castmate-plugin-twitch-shared"
import { Duration } from "castmate-schema"

export function setupModeration() {
	onChannelAuth((channel, service) => {
		service.eventsub.onChannelModeratorAdd(channel.twitchId, (event) => {
			ViewerCache.getInstance().setIsMod(event.userId, false)
		})

		service.eventsub.onChannelModeratorRemove(channel.twitchId, (event) => {
			ViewerCache.getInstance().setIsMod(event.userId, false)
		})
	})

	defineAction({
		id: "timeout",
		name: "Timeout Viewer",
		icon: "mdi mdi-timer-remove-outline",
		config: {
			type: Object,
			properties: {
				viewer: { type: TwitchViewer, name: "Viewer", required: true, template: true },
				duration: { type: Duration, name: "Duration", required: true, template: true, default: 15 },
				reason: { type: String, name: "Reason", template: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await TwitchAccount.channel.apiClient.moderation.banUser(TwitchAccount.channel.twitchId, {
				user: config.viewer,
				duration: config.duration,
				reason: config.reason ?? "",
			})
		},
	})

	defineAction({
		id: "ban",
		name: "Ban Viewer",
		icon: "mdi mdi-cancel",
		config: {
			type: Object,
			properties: {
				viewer: { type: TwitchViewer, name: "Viewer", required: true, template: true },
				reason: { type: String, name: "Reason", template: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await TwitchAccount.channel.apiClient.moderation.banUser(TwitchAccount.channel.twitchId, {
				user: config.viewer,
				reason: config.reason ?? "",
			})
		},
	})

	defineAction({
		id: "unban",
		name: "Unban Viewer",
		icon: "mdi mdi-cancel",
		config: {
			type: Object,
			properties: {
				viewer: { type: TwitchViewer, name: "Viewer", required: true, template: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await TwitchAccount.channel.apiClient.moderation.unbanUser(TwitchAccount.channel.twitchId, config.viewer)
		},
	})
}
