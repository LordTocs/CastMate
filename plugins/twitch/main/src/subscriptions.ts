import { ApiClient } from "@twurple/api"
import { EventSubWsListener } from "@twurple/eventsub-ws"
import { TwitchAccount } from "./twitch-auth"
import { defineTrigger } from "castmate-core"
import { Range } from "castmate-schema"
import { TwitchAPIService, onChannelAuth } from "./api-harness"
import { ViewerCache } from "./viewer-cache"
import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { inTwitchViewerGroup } from "./group"

export function setupSubscriptions() {
	const subscription = defineTrigger({
		id: "subscription",
		name: "Subscriber",
		icon: "mdi mdi-star-outline",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				totalMonths: { type: Range, name: "Months", required: true, default: new Range(1) },
				streakMonths: { type: Range, name: "Streak Months", required: true, default: new Range(1) },
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
				totalMonths: { type: Number, required: true },
				streakMonths: { type: Number, required: true },
				durationMonths: { type: Number, required: true },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.userId, config.group))) {
				return false
			}

			if (!config.totalMonths.inRange(context.totalMonths)) return false
			if (!config.streakMonths.inRange(context.streakMonths)) return false

			return true
		},
	})

	const giftSub = defineTrigger({
		id: "giftedSub",
		name: "Gifted Subscription",
		description: "Fires for when a user gifts subs. Based on the number of subs gifted..",
		icon: "mdi mdi-star-outline",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				subs: { type: Range, name: "Subs Gifted", required: true, default: new Range(1) },
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
				subs: { type: Number, required: true },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.userId, config.group))) {
				return false
			}

			if (!config.subs.inRange(context.subs)) return false

			return true
		},
	})

	onChannelAuth((channel, service) => {
		service.eventsub.onChannelSubscription(channel.twitchId, (event) => {
			ViewerCache.getInstance().cacheSubEvent(event)
		})

		service.eventsub.onChannelSubscriptionMessage(channel.twitchId, async (event) => {
			subscription({
				user: event.userDisplayName,
				userId: event.userId,
				userColor: await ViewerCache.getInstance().getChatColor(event.userId),
				totalMonths: event.cumulativeMonths,
				streakMonths: event.streakMonths ?? 1,
				durationMonths: event.durationMonths,
			})
		})

		service.eventsub.onChannelSubscriptionGift(channel.twitchId, async (event) => {
			giftSub({
				user: event.gifterDisplayName,
				userId: event.gifterId,
				userColor: await ViewerCache.getInstance().getChatColor(event.gifterId),
				subs: event.amount,
			})
		})
	})
}
