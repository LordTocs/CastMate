import { defineState, defineTrigger } from "castmate-core"
import { Range } from "castmate-schema"
import { onChannelAuth } from "./api-harness"

export function setupHypeTrains() {
	const hypeTrainStarted = defineTrigger({
		id: "hypeTrainStarted",
		name: "Hype Train Started",
		icon: "mdi mdi-train-car-caboose",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {},
		},
		context: {
			type: Object,
			properties: {
				level: { type: Number, required: true, default: 1 },
				progress: { type: Number, required: true, default: 0 },
				goal: { type: Number, required: true, default: 100 },
				total: { type: Number, required: true, default: 0 },
			},
		},
		async handle(config, context) {
			return true
		},
	})

	const hypeTrainLevelUp = defineTrigger({
		id: "hypeTrainLevelUp",
		name: "Hype Train Level Up",
		icon: "mdi mdi-train-car-caboose",
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
				level: { type: Number, required: true, default: 2 },
				progress: { type: Number, required: true, default: 50 },
				goal: { type: Number, required: true, default: 100 },
				total: { type: Number, required: true, default: 150 },
			},
		},
		async handle(config, context) {
			return config.level.inRange(context.level)
		},
	})

	const hypeTrainEnded = defineTrigger({
		id: "hypeTrainEnded",
		name: "Hype Train Ended",
		icon: "mdi mdi-train-car-caboose",
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
				level: { type: Number, required: true, default: 3 },
				progress: { type: Number, required: true, default: 30 },
				goal: { type: Number, required: true, default: 300 },
				total: { type: Number, required: true, default: 230 },
			},
		},
		async handle(config, context) {
			return config.level.inRange(context.level)
		},
	})

	const hypeTrainLevel = defineState("hypeTrainLevel", {
		type: Number,
		name: "Hype Train Level",
		required: true,
		default: 0,
	})
	const hypeTrainProgress = defineState("hypeTrainProgress", {
		type: Number,
		name: "Hype Train Point Progress",
		required: true,
		default: 0,
	})
	const hypeTrainGoal = defineState("hypeTrainGoal", {
		type: Number,
		name: "Hype Train Point Goal",
		required: true,
		default: 0,
	})
	const hypeTrainTotal = defineState("hypeTrainTotal", {
		type: Number,
		name: "Hype Train Point Total",
		required: true,
		default: 0,
	})
	const hypeTrainExists = defineState("hypeTrainExists", {
		type: Boolean,
		name: "Hype Train Exists",
		required: true,
		default: false,
	})

	onChannelAuth(async (channel, service) => {
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

		const hypeTrain = await channel.apiClient.hypeTrain.getHypeTrainEventsForBroadcaster(channel.twitchId)

		const event = hypeTrain.data[0]

		if (event) {
			if (event.expiryDate > new Date()) {
				//Hypetrain is running
				hypeTrainLevel.value = event.level
				hypeTrainTotal.value = event.total
				hypeTrainGoal.value = event.goal
				//hypeTrainProgress.value = event.TWITCH NEEDS TO FIX THIS
				hypeTrainExists.value = true
			}
		}
	})
}
