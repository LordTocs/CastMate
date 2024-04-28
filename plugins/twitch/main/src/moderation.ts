import { defineAction, defineTrigger } from "castmate-core"
import { onChannelAuth } from "./api-harness"
import { TwitchAccount } from "./twitch-auth"
import { ViewerCache } from "./viewer-cache"
import { TwitchViewer, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { Duration } from "castmate-schema"
import { inTwitchViewerGroup } from "./group"

export function setupModeration() {
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

	const ban = defineTrigger({
		id: "ban",
		name: "Viewer Banned",
		icon: "mdi mdi-cancel",
		config: {
			type: Object,
			properties: {
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				viewer: { type: TwitchViewer, required: true, default: "27082158" },
			},
		},
		async handle(config, context, mapping) {
			if (!(await inTwitchViewerGroup(context.viewer, config.group))) {
				return false
			}

			return true
		},
	})

	const timedout = defineTrigger({
		id: "timeout",
		name: "Viewer Timed Out",
		icon: "mdi mdi-timer-remove-outline",
		config: {
			type: Object,
			properties: {
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				viewer: { type: TwitchViewer, required: true, default: "27082158" },
			},
		},
		async handle(config, context, mapping) {
			if (!(await inTwitchViewerGroup(context.viewer, config.group))) {
				return false
			}

			return true
		},
	})

	onChannelAuth((channel, service) => {
		service.eventsub.onChannelModeratorAdd(channel.twitchId, (event) => {
			ViewerCache.getInstance().setIsMod(event.userId, false)
		})

		service.eventsub.onChannelModeratorRemove(channel.twitchId, (event) => {
			ViewerCache.getInstance().setIsMod(event.userId, false)
		})

		service.eventsub.onChannelBan(channel.twitchId, (event) => {
			if (event.isPermanent) {
				ban({ viewer: event.userId })
			} else {
				timedout({ viewer: event.userId })
			}
		})
	})
}
