import { ApiClient } from "@twurple/api"
import { EventSubWsListener } from "@twurple/eventsub-ws"
import { TwitchAccount } from "./twitch-auth"
import { defineTrigger } from "castmate-core"
import { Range } from "castmate-schema"
import { TwitchAPIService, onChannelAuth } from "./api-harness"

export function setupSubscriptions() {
	const subscription = defineTrigger({
		id: "subscription",
		name: "Subscriber",
		icon: "mdi mdi-star-outline",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				months: { type: Range, name: "Months", required: true },
			},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
				months: { type: Number, required: true },
			},
		},
		async handle(config, context) {
			if (!config.months.inRange(context.months)) return false

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
			},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
				months: { type: Number, required: true },
			},
		},
		async handle(config, context) {
			if (!config.subs.inRange(context.months)) return false

			return true
		},
	})
}
