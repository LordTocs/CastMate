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

	const predictionLocked = defineTrigger({
		id: "predictionLocked",
		name: "Prediction Locked",
		description: "Fires when a prediction is locked and no more points can be added.",
		icon: "mdi mdi-crystal-ball",
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

	const predictionSettled = defineTrigger({
		id: "predictionSettled",
		name: "Prediction Settled",
		description: "Fires when the streamer picks the winning outcome of the prediction.",
		icon: "mdi mdi-crystal-ball",
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

	const predictionTitle = defineState("predictionTitle", {
		type: String,
	})

	const predictionExists = defineState("predictionExists", {
		type: Boolean,
		required: true,
		default: false,
	})

	onChannelAuth((channel, service) => {
		service.eventsub.onChannelPredictionBegin(channel.twitchId, (event) => {
			predictionTitle.value = event.title
			predictionExists.value = true

			predictionStarted({})
		})

		service.eventsub.onChannelPredictionEnd(channel.twitchId, (event) => {
			predictionTitle.value = undefined
			predictionExists.value = false

			predictionSettled({})
		})

		service.eventsub.onChannelPredictionLock(channel.twitchId, (event) => {
			predictionLocked({})
		})

		service.eventsub.onChannelPredictionProgress(channel.twitchId, (event) => {
			//
		})
	})
}
