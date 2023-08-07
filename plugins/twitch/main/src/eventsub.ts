import { ApiClient } from "@twurple/api"
import { EventSubWsListener } from "@twurple/eventsub-ws"
import { TwitchAccount } from "./twitch-auth"
import { defineTrigger } from "castmate-core"
import { Range } from "castmate-schema"

export function setupEventSub() {
	let eventSub: EventSubWsListener | undefined

	function setupListener() {
		const channelAccount = TwitchAccount.storage.getById("channel")

		if (!channelAccount) return

		eventSub = new EventSubWsListener({
			apiClient: channelAccount.apiClient,
		})

		const channelId = channelAccount.config.twitchId

		eventSub.onChannelFollow(channelId, channelId, (event) => {
			onFollow({
				user: event.userDisplayName,
				userId: event.userId,
				userColor: "#000000", //TODO
			})
		})

		eventSub.onChannelSubscription(channelId, (event) => {})
	}

	const onFollow = defineTrigger({
		id: "follow",
		name: "Followed",
		icon: "mdi mdi-heart",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
			},
		},
		async handle(config, context) {
			return true
		},
	})

	const onSub = defineTrigger({
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
}
