import { defineTrigger } from "castmate-core"
import { Range } from "castmate-schema"
import { onChannelAuth } from "./api-harness"
import { ViewerCache } from "./viewer-cache"
import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { inTwitchViewerGroup } from "./group"

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
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true, default: "LordTocs" },
				userId: { type: String, required: true, default: "27082158" },
				userColor: { type: String, required: true, default: "#4411FF" },
				raiders: { type: Number, required: true, default: 15 },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.userId, config.group))) {
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
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				raiders: { type: Number, required: true, default: 15 },
				raidedUser: { type: String, required: true, default: "LordTocs" },
				raidedUserId: { type: String, required: true, default: "27082158" },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.raidedUserId, config.group))) {
				return false
			}

			return Range.inRange(config.raiders, context.raiders)
		},
	})

	onChannelAuth((channel, service) => {
		service.eventsub.onChannelRaidTo(channel.twitchId, async (event) => {
			raid({
				user: event.raidingBroadcasterDisplayName,
				userId: event.raidingBroadcasterId,
				userColor: await ViewerCache.getInstance().getChatColor(event.raidingBroadcasterId),
				raiders: event.viewers,
			})
		})

		service.eventsub.onChannelRaidFrom(channel.twitchId, (event) => {
			raidOut({
				raiders: event.viewers,
				raidedUser: event.raidedBroadcasterName,
				raidedUserId: event.raidedBroadcasterId,
			})
		})
	})
}
