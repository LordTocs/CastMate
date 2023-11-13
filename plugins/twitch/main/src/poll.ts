import { defineAction, defineState, defineTrigger } from "castmate-core"
import { TwitchAPIService, onChannelAuth } from "./api-harness"
import { TwitchAccount } from "./twitch-auth"
import { abortableSleep, setAbortableTimeout } from "castmate-core/src/util/abort-utils"
import { Duration } from "castmate-schema"
import _maxBy from "lodash/maxBy"
export function setupPolls() {
	const pollId = defineState("pollId", {
		type: String,
		name: "Poll Id",
	})

	const pollTitle = defineState("pollTitle", {
		type: String,
		name: "Poll Title",
	})

	defineAction({
		id: "createPoll",
		name: "Create Poll",
		description: "Create's a twitch poll",
		icon: "mdi mdi-poll",
		duration: {
			dragType: "length",
			rightSlider: {
				sliderProp: "duration",
			},
		},
		config: {
			type: Object,
			properties: {
				title: { type: String, name: "Title", template: true, required: true, default: "" },
				duration: { type: Duration, name: "Duration", template: true, required: true, default: 30 },
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
			properties: {
				title: { type: String },
			},
		},
		context: {
			type: Object,
			properties: {
				title: { type: String, required: true, default: "Test Poll" },
				totalVotes: { type: Number, required: true, default: 0 },
				choices: {
					type: Array,
					items: {
						type: Object,
						properties: {
							title: { type: String },
							votes: { type: Number },
							fraction: { type: Number },
						},
					},
					default: [
						{ title: "Item A", votes: 0, fraction: 0 },
						{ title: "Item B", votes: 0, fraction: 0 },
					],
				},
			},
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
			properties: {
				title: { type: String, required: true, default: "Test Poll" },
				totalVotes: { type: Number, required: true, default: 10 },
				winner: {
					type: Object,
					properties: {
						title: { type: String, required: true, default: "Item A" },
						votes: { type: Number, required: true, default: 7 },
						fraction: { type: Number, required: true, default: 0.7 },
					},
				},
				choices: {
					type: Array,
					items: {
						type: Object,
						properties: {
							title: { type: String, required: true },
							votes: { type: Number, required: true },
							fraction: { type: Number, required: true },
						},
					},
					default: [
						{ title: "Item A", votes: 7, fraction: 0.7 },
						{ title: "Item B", votes: 3, fraction: 0.3 },
					],
				},
			},
		},
		async handle(config, context) {
			return false
		},
	})

	onChannelAuth((account, service) => {
		service.eventsub.onChannelPollBegin(account.twitchId, (event) => {
			const totalVotes = 0
			const choices = event.choices.map((c) => ({
				title: c.title,
				votes: 0,
				fraction: 0,
			}))

			pollTitle.value = event.title
			pollId.value = event.id
			pollStarted({
				title: event.title,
				totalVotes,
				choices,
			})
		})

		service.eventsub.onChannelPollEnd(account.twitchId, (event) => {
			pollId.value = undefined

			let totalVotes = 0
			for (const choice of event.choices) {
				totalVotes += choice.totalVotes
			}
			const choices = event.choices.map((c) => ({
				title: c.title,
				votes: c.totalVotes,
				fraction: c.totalVotes / totalVotes,
			}))
			const winner = _maxBy(choices, (r) => r.votes)
			if (!winner) return
			pollEnded({
				title: event.title,
				totalVotes,
				winner,
				choices,
			})
		})

		service.eventsub.onChannelPollProgress(account.twitchId, (event) => {})
	})
}
