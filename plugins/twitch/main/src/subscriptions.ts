import { ApiClient } from "@twurple/api"
import { EventSubWsListener } from "@twurple/eventsub-ws"
import { TwitchAccount } from "./twitch-auth"
import { defineState, defineTrigger } from "castmate-core"
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
				totalMonths: { type: Range, name: "Months", required: true, default: { min: 1 } },
				streakMonths: { type: Range, name: "Streak Months", required: true, default: { min: 1 } },
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true, default: "LordTocs" },
				userId: { type: String, required: true, default: "27082158" },
				userColor: { type: String, required: true, default: "#4411FF" },
				totalMonths: { type: Number, required: true, default: 5 },
				streakMonths: { type: Number, required: true, default: 3 },
				durationMonths: { type: Number, required: true, default: 1 },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.userId, config.group))) {
				return false
			}

			if (!Range.inRange(config.totalMonths, context.totalMonths)) return false
			if (!Range.inRange(config.streakMonths, context.streakMonths)) return false

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
				subs: { type: Range, name: "Subs Gifted", required: true, default: { min: 1 } },
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true, default: "LordTocs" },
				userId: { type: String, required: true, default: "27082158" },
				userColor: { type: String, required: true, default: "#4411FF" },
				subs: { type: Number, required: true, default: 5 },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.userId, config.group))) {
				return false
			}

			if (!Range.inRange(config.subs, context.subs)) return false

			return true
		},
	})

	const subscribers = defineState("subscribers", {
		type: Number,
		required: true,
		default: 0,
		name: "Subscribers",
	})

	const subscriberPoints = defineState("subscriberPoints", {
		type: Number,
		required: true,
		default: 0,
		name: "Subscriber Points",
	})

	async function updateSubscriberCount() {
		try {
			const subs = await TwitchAccount.channel.apiClient.subscriptions.getSubscriptions(
				TwitchAccount.channel.twitchId
			)
			subscribers.value = subs.total
			subscriberPoints.value = subs.points
		} catch {}
	}

	onChannelAuth((channel, service) => {
		service.eventsub.onChannelSubscription(channel.twitchId, (event) => {
			ViewerCache.getInstance().cacheSubEvent(event)
			updateSubscriberCount()
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
			ViewerCache.getInstance().cacheGiftSubEvent(event)

			giftSub({
				user: event.gifterDisplayName,
				userId: event.gifterId,
				userColor: await ViewerCache.getInstance().getChatColor(event.gifterId),
				subs: event.amount,
			})
		})

		updateSubscriberCount()
	})
}
