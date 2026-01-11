import { createTriggerScheduler, defineAction, defineState, defineTrigger, onProfilesChanged } from "castmate-core"
import { Duration, Range, Timer } from "castmate-schema"
import { onChannelAuth } from "./api-harness"
import { ViewerCache } from "./viewer-cache"
import { TwitchViewer, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { inTwitchViewerGroup } from "./group"
import { TwitchAccount } from "./twitch-auth"

export function setupRaids() {
	const raid = defineTrigger({
		id: "raid",
		name: "Incoming Raid",
		icon: "mdi mdi-parachute",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				raiders: {
					type: Range,
					name: "Raider Count",
					default: { min: 1 },
					required: true,
				},
				group: { type: TwitchViewerGroup, name: "Raiding Streamer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				raider: { type: TwitchViewer, required: true, default: "27082158" },
				raiders: { type: Number, required: true, default: 15 },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.raider, config.group, context))) {
				return false
			}

			return Range.inRange(config.raiders, context.raiders)
		},
	})

	const raidOut = defineTrigger({
		id: "raidOut",
		name: "Outgoing Raid",
		icon: "mdi mdi-parachute",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				raiders: {
					type: Range,
					name: "Raider Count",
					default: { min: 1 },
					required: true,
				},
				group: { type: TwitchViewerGroup, name: "Raided Streamer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				raiders: { type: Number, required: true, default: 15 },
				raidedStreamer: { type: TwitchViewer, required: true, default: "27082158" },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.raidedStreamer, config.group, context))) {
				return false
			}

			return Range.inRange(config.raiders, context.raiders)
		},
	})

	defineAction({
		id: "startRaid",
		name: "Start Raid",
		icon: "mdi mdi-parachute",
		config: {
			type: Object,
			properties: {
				target: { type: TwitchViewer, required: true, name: "Raid Target" },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await TwitchAccount.channel.apiClient.raids.startRaid(TwitchAccount.channel.twitchId, config.target)
		},
	})

	defineAction({
		id: "cancelRaid",
		name: "Cancel Raid",
		icon: "mdi mdi-parachute",
		config: {
			type: Object,
			properties: {},
		},
		async invoke(config, contextData, abortSignal) {
			await TwitchAccount.channel.apiClient.raids.cancelRaid(TwitchAccount.channel.twitchId)
		},
	})

	const beforeRaid = defineTrigger({
		id: "beforeRaid",
		name: "Raid Countdown",
		description: "Runs in advance of a the raid countdown ending.",
		icon: "mdi mdi-parachute",
		config: {
			type: Object,
			properties: {
				advance: { type: Duration, name: "Advance", required: true, default: 10 },
				group: { type: TwitchViewerGroup, name: "Raided Streamer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				raidTarget: { type: TwitchViewer, name: "Raid Target", required: true },
				advance: { type: Duration, required: true, view: false },
			},
		},
		async handle(config, context, mapping) {
			return config.advance == context.advance
		},
	})

	const raidStarted = defineTrigger({
		id: "raidStarted",
		name: "Raid Started",
		icon: "mdi mdi-parachute",
		config: {
			type: Object,
			properties: {
				viewerGroup: { type: TwitchViewerGroup, name: "Raid Group", required: true },
			},
		},
		context: {
			type: Object,
			properties: {
				raidTarget: { type: TwitchViewer, name: "Raid Target", required: true },
			},
		},
		async handle(config, context, mapping) {
			if (await inTwitchViewerGroup(context.raidTarget, config.viewerGroup)) {
				return true
			}
			return false
		},
	})

	const raidCanceled = defineTrigger({
		id: "raidCanceled",
		name: "Raid Canceled",
		icon: "mdi mdi-parachute",
		config: {
			type: Object,
			properties: {
				viewerGroup: { type: TwitchViewerGroup, name: "Raid Group", required: true },
			},
		},
		context: {
			type: Object,
			properties: {
				raidTarget: { type: TwitchViewer, name: "Raid Target", required: true },
			},
		},
		async handle(config, context, mapping) {
			if (await inTwitchViewerGroup(context.raidTarget, config.viewerGroup)) {
				return true
			}
			return false
		},
	})

	const raidTimer = defineState("raidTimer", {
		type: Timer,
		name: "Raid Timer",
		required: true,
	})

	const raidTarget = defineState("raidTarget", {
		type: TwitchViewer,
		name: "Raid Target",
	})

	createTriggerScheduler({
		name: "RaidScheduler",
		trigger: beforeRaid,
		timer: raidTimer,
		getContext() {
			return { raidTarget: raidTarget.value?.id ?? "" }
		},
	})

	onChannelAuth((channel, service) => {
		service.eventsub.onChannelModerate(channel.twitchId, channel.twitchId, async (data) => {
			if (data.moderationAction == "raid") {
				const target = data.userId
				raidTarget.value = await ViewerCache.getInstance().getResolvedViewer(target)
				raidTimer.value = Timer.fromDuration(90, false)
				await raidStarted({ raidTarget: target })
			} else if (data.moderationAction == "unraid") {
				const target = data.userId
				raidTarget.value = undefined
				raidTimer.value = Timer.fromDuration(0, true)
				await raidCanceled({ raidTarget: target })
			}
		})

		service.eventsub.onChannelRaidTo(channel.twitchId, async (event) => {
			raid({
				raider: event.raidingBroadcasterId,
				raiders: event.viewers,
			})
		})

		service.eventsub.onChannelRaidFrom(channel.twitchId, (event) => {
			raidOut({
				raiders: event.viewers,
				raidedStreamer: event.raidedBroadcasterId,
			})
		})
	})
}
