import { ApiClient } from "@twurple/api"
import { EventSubWsListener } from "@twurple/eventsub-ws"
import { TwitchAccount } from "./twitch-auth"
import { defineState, defineTrigger } from "castmate-core"
import { Range } from "castmate-schema"
import { TwitchAPIService, onChannelAuth } from "./api-harness"
import { ViewerCache } from "./viewer-cache"
import { TwitchViewer, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
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
				tier1: { type: Boolean, name: "Tier 1", required: true, default: true },
				tier2: { type: Boolean, name: "Tier 2", required: true, default: true },
				tier3: { type: Boolean, name: "Tier 3", required: true, default: true },
				totalMonths: { type: Range, name: "Months", required: true, default: { min: 1 } },
				streakMonths: { type: Range, name: "Streak Months", required: true, default: { min: 1 } },
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				tier: { type: Number, required: true, default: 1 },
				viewer: { type: TwitchViewer, required: true, default: "27082158" },
				totalMonths: { type: Number, required: true, default: 5 },
				streakMonths: { type: Number, required: true, default: 3 },
				durationMonths: { type: Number, required: true, default: 1 },
				message: { type: String, required: true, default: "" },
			},
		},
		async handle(config, context) {
			if (context.tier == 1 && !config.tier1) return false
			if (context.tier == 2 && !config.tier2) return false
			if (context.tier == 3 && !config.tier3) return false

			if (!(await inTwitchViewerGroup(context.viewer, config.group))) {
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
				gifter: { type: TwitchViewer, required: true, default: "27082158" },
				subs: { type: Number, required: true, default: 5 },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.gifter, config.group))) {
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

	const lastSubscriber = defineState(
		"lastSubscriber",
		{
			type: TwitchViewer,
			name: "Last Subscriber",
		},
		true
	)

	async function updateSubscriberCount() {
		try {
			const subs = await TwitchAccount.channel.apiClient.subscriptions.getSubscriptions(
				TwitchAccount.channel.twitchId
			)
			subscribers.value = subs.total
			subscriberPoints.value = subs.points
		} catch {}
	}

	onChannelAuth(async (channel, service) => {
		service.eventsub.onChannelSubscription(channel.twitchId, (event) => {
			ViewerCache.getInstance().cacheSubEvent(event)
			updateSubscriberCount()
		})

		service.eventsub.onChannelSubscriptionMessage(channel.twitchId, async (event) => {
			let tier = 1
			if (event.tier == "2000") {
				tier = 2
			} else if (event.tier == "3000") {
				tier = 3
			}

			lastSubscriber.value = await ViewerCache.getInstance().getResolvedViewer(event.userId)

			subscription({
				tier,
				viewer: event.userId,
				totalMonths: event.cumulativeMonths,
				streakMonths: event.streakMonths ?? 1,
				durationMonths: event.durationMonths,
				message: event.messageText ?? "",
			})
		})

		service.eventsub.onChannelSubscriptionGift(channel.twitchId, async (event) => {
			ViewerCache.getInstance().cacheGiftSubEvent(event)

			let tier = 1
			if (event.tier == "2000") {
				tier = 2
			} else if (event.tier == "3000") {
				tier = 3
			}

			giftSub({
				gifter: event.gifterId,
				subs: event.amount,
			})
		})

		updateSubscriberCount()
	})
}
