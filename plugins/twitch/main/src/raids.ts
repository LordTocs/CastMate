import { defineTrigger } from "castmate-core"
import { Range } from "castmate-schema"
import { onChannelAuth } from "./api-harness"
import { ViewerCache } from "./viewer-cache"

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
					default: new Range(1),
					required: true,
				},
			},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
				raiders: { type: Number, required: true },
			},
		},
		async handle(config, context) {
			return config.raiders.inRange(context.raiders)
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
					default: new Range(),
					required: true,
				},
			},
		},
		context: {
			type: Object,
			properties: {
				raiders: { type: Number, required: true },
				raidedUser: { type: String, required: true },
				raidedUserId: { type: String, required: true },
			},
		},
		async handle(config, context) {
			return config.raiders.inRange(context.raiders)
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
