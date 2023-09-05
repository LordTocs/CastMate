import { defineState, defineTrigger } from "castmate-core"
import { Range } from "castmate-schema"
import { onChannelAuth } from "./api-harness"

export function setupHypeTrains() {
	const hypeTrainStarted = defineTrigger({
		id: "hypeTrainStarted",
		name: "Hype Train Started",
		icon: "mdi mdi-heart",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {},
		},
		context: {
			type: Object,
			properties: {
				level: { type: Number, required: true },
				progress: { type: Number, required: true },
				goal: { type: Number, required: true },
				total: { type: Number, required: true },
			},
		},
		async handle(config, context) {
			return true
		},
	})

	const hypeTrainLevelUp = defineTrigger({
		id: "hypeTrainLevelUp",
		name: "Hype Train Level Up",
		icon: "mdi mdi-heart",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				level: {
					type: Range,
					name: "Level",
					default: new Range(1),
					required: true,
				},
			},
		},
		context: {
			type: Object,
			properties: {
				level: { type: Number, required: true },
				progress: { type: Number, required: true },
				goal: { type: Number, required: true },
				total: { type: Number, required: true },
			},
		},
		async handle(config, context) {
			return config.level.inRange(context.level)
		},
	})

	const hypeTrainEnded = defineTrigger({
		id: "hypeTrainEnded",
		name: "Hype Train Ended",
		icon: "mdi mdi-heart",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				level: {
					type: Range,
					name: "Level",
					default: new Range(1),
					required: true,
				},
			},
		},
		context: {
			type: Object,
			properties: {
				level: { type: Number, required: true },
				progress: { type: Number, required: true },
				goal: { type: Number, required: true },
				total: { type: Number, required: true },
			},
		},
		async handle(config, context) {
			return config.level.inRange(context.level)
		},
	})

	const hypeTrainLevel = defineState("hypeTrainLevel", {
		type: Number,
		required: true,
		default: 0,
	})
	const hypeTrainProgress = defineState("hypeTrainLevel", {
		type: Number,
		required: true,
		default: 0,
	})
	const hypeTrainGoal = defineState("hypeTrainLevel", {
		type: Number,
		required: true,
		default: 0,
	})
	const hypeTrainTotal = defineState("hypeTrainTotal", {
		type: Number,
		required: true,
		default: 0,
	})
	const hypeTrainExists = defineState("hypeTrainExists", {
		type: Boolean,
		required: true,
		default: false,
	})

	onChannelAuth((channel, service) => {
		service.eventsub.onChannelHypeTrainBegin(channel.twitchId, (event) => {
			hypeTrainLevel.value = event.level
			hypeTrainProgress.value = event.progress
			hypeTrainGoal.value = event.goal
			hypeTrainTotal.value = event.total
			hypeTrainExists.value = true

			hypeTrainStarted({
				level: event.level,
				progress: event.progress,
				goal: event.goal,
				total: event.total,
			})
		})

		service.eventsub.onChannelHypeTrainEnd(channel.twitchId, (event) => {
			const progress = hypeTrainProgress.value
			const goal = hypeTrainGoal.value

			hypeTrainLevel.value = 0
			hypeTrainProgress.value = 0
			hypeTrainGoal.value = 0
			hypeTrainTotal.value = 0
			hypeTrainExists.value = false

			hypeTrainEnded({
				level: event.level,
				progress,
				goal,
				total: event.total,
			})
		})

		service.eventsub.onChannelHypeTrainProgress(channel.twitchId, (event) => {
			const levelUp = event.level > hypeTrainLevel.value

			hypeTrainLevel.value = event.level
			hypeTrainProgress.value = event.progress
			hypeTrainGoal.value = event.goal
			hypeTrainTotal.value = event.total

			if (levelUp) {
				hypeTrainLevelUp({
					level: event.level,
					progress: event.progress,
					goal: event.goal,
					total: event.total,
				})
			}
		})
	})
}
