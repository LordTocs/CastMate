import { defineAction, defineState, defineTrigger } from "castmate-core"
import { onChannelAuth } from "./api-harness"
import { Duration } from "castmate-schema"

export function setupPredictions() {
	defineAction({
		id: "createPrediction",
		name: "Create Prediction",
		description: "Creates a twitch prediction.",
		icon: "mdi mdi-crystal-ball",
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
				outcomes: {
					type: Array,
					name: "Outcomes",
					items: {
						type: String,
						name: "Outcome",
						template: true,
					},
					required: true,
				},
			},
		},
		async invoke(config, contextData, abortSignal) {},
	})

	const predictionStarted = defineTrigger({
		id: "predictionStarted",
		name: "Prediction Started",
		description: "Fires when a prediction is first opened to viewers.",
		icon: "mdi mdi-crystal-ball",
		config: {
			type: Object,
			properties: {
				title: { type: String, required: true, name: "title", default: "" },
			},
		},
		context: {
			type: Object,
			properties: {
				title: { type: String, required: true },
				outcomes: {
					type: Array,
					items: {
						type: Object,
						properties: {
							title: { type: String, required: true },
							color: { type: String, required: true },
							points: { type: Number, required: true },
						},
					},
				},
			},
		},
		async handle(config, context) {
			return config.title == context.title
		},
	})

	const predictionLocked = defineTrigger({
		id: "predictionLocked",
		name: "Prediction Locked",
		description: "Fires when a prediction is locked and no more points can be added.",
		icon: "mdi mdi-crystal-ball",
		config: {
			type: Object,
			properties: {
				title: { type: String, required: true, name: "title", default: "" },
			},
		},
		context: {
			type: Object,
			properties: {
				title: { type: String, required: true },
				total: { type: Number, required: true },
				outcomes: {
					type: Array,
					items: {
						type: Object,
						properties: {
							title: { type: String, required: true },
							color: { type: String, required: true },
							points: { type: Number, required: true },
						},
					},
				},
			},
		},
		async handle(config, context) {
			return config.title == context.title
		},
	})

	const predictionSettled = defineTrigger({
		id: "predictionSettled",
		name: "Prediction Settled",
		description: "Fires when the streamer picks the winning outcome of the prediction.",
		icon: "mdi mdi-crystal-ball",
		config: {
			type: Object,
			properties: {
				title: { type: String, required: true, name: "title", default: "" },
			},
		},
		context: {
			type: Object,
			properties: {
				title: { type: String, required: true },
				total: { type: Number, required: true },
				outcomes: {
					type: Array,
					items: {
						type: Object,
						properties: {
							title: { type: String, required: true },
							color: { type: String, required: true },
							points: { type: Number, required: true },
						},
					},
				},
			},
		},
		async handle(config, context) {
			return config.title == context.title
		},
	})

	const predictionTitle = defineState("predictionTitle", {
		type: String,
		name: "Prediction Title",
	})

	const predictionId = defineState("predictionId", {
		type: String,
		name: "Prediction ID",
	})

	const predictionExists = defineState("predictionExists", {
		type: Boolean,
		required: true,
		default: false,
		name: "Prediction Exists",
	})

	const predictionTotal = defineState("predictionTotal", {
		type: Number,
		required: true,
		default: 0,
		name: "Prediction Point Total",
	})

	onChannelAuth((channel, service) => {
		service.eventsub.onChannelPredictionBegin(channel.twitchId, (event) => {
			predictionTitle.value = event.title
			predictionExists.value = true
			predictionId.value = event.id
			predictionTotal.value = 0

			predictionStarted({
				title: event.title,
				outcomes: event.outcomes.map((o) => ({ title: o.title, color: o.color, points: 0 })),
			})
		})

		service.eventsub.onChannelPredictionEnd(channel.twitchId, (event) => {
			predictionTitle.value = undefined
			predictionExists.value = false
			predictionId.value = undefined
			predictionTotal.value = 0

			let total = 0
			for (let o of event.outcomes) {
				total += o.channelPoints
			}

			predictionSettled({
				title: event.title,
				total,
				outcomes: event.outcomes.map((o) => ({ title: o.title, color: o.color, points: o.channelPoints })),
			})
		})

		service.eventsub.onChannelPredictionLock(channel.twitchId, (event) => {
			let total = 0
			for (let o of event.outcomes) {
				total += o.channelPoints
			}

			predictionTotal.value = total

			predictionLocked({
				title: event.title,
				total,
				outcomes: event.outcomes.map((o) => ({ title: o.title, color: o.color, points: o.channelPoints })),
			})
		})

		service.eventsub.onChannelPredictionProgress(channel.twitchId, (event) => {
			let total = 0
			for (let o of event.outcomes) {
				total += o.channelPoints
			}
			predictionTotal.value = total
		})
	})
}
