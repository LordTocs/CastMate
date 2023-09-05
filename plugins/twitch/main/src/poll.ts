import { defineAction, defineState, defineTrigger } from "castmate-core"
import { TwitchAPIService, onChannelAuth } from "./api-harness"
import { TwitchAccount } from "./twitch-auth"
import { abortableSleep, setAbortableTimeout } from "castmate-core/src/util/abort-utils"

export function setupPolls() {
	const pollId = defineState("pollId", {
		type: String,
	})

	defineAction({
		id: "createPoll",
		name: "Create Poll",
		description: "Create's a twitch poll",
		type: "time",
		icon: "mdi mdi-poll",
		config: {
			type: Object,
			properties: {
				title: { type: String, name: "Title", template: true, required: true, default: "" },
				duration: { type: Number, name: "Duration", template: true, required: true, default: 30 },
				choices: {
					type: Array,
					name: "Outcomes",
					items: { type: String, name: "Outcome", required: true },
					required: true,
					default: [],
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			const poll = await TwitchAccount.channel.apiClient.polls.createPoll(TwitchAccount.channel.twitchId, {
				title: config.title,
				duration: config.duration,
				choices: config.choices,
			})

			await abortableSleep(config.duration, abortSignal, async () => {
				await TwitchAccount.channel.apiClient.polls.endPoll(TwitchAccount.channel.twitchId, poll.id) //TODO: Should abort show the result
			})
		},
	})

	const pollStarted = defineTrigger({
		id: "pollStarted",
		name: "Poll Started",
		description: "Fires when a poll starts",
		icon: "mdi mdi-poll",
		config: {
			type: Object,
			properties: {},
		},
		context: {
			type: Object,
			properties: {},
		},
		async handle(config, context) {
			return false
		},
	})

	const pollEnded = defineTrigger({
		id: "pollEnded",
		name: "Poll Ended",
		description: "Fires when a poll closes.",
		icon: "mdi mdi-poll",
		config: {
			type: Object,
			properties: {},
		},
		context: {
			type: Object,
			properties: {},
		},
		async handle(config, context) {
			return false
		},
	})

	onChannelAuth((account, service) => {
		service.eventsub.onChannelPollBegin(account.twitchId, (event) => {
			pollId.value = event.id
		})

		service.eventsub.onChannelPollEnd(account.twitchId, (event) => {
			pollId.value = undefined
		})

		service.eventsub.onChannelPollProgress(account.twitchId, (event) => {
			//
		})
	})
}
