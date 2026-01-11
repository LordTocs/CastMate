import { defineState, defineTrigger, startPerfTime, usePluginLogger } from "castmate-core"
import { Range } from "castmate-schema"
import { onChannelAuth } from "./api-harness"
import { EventSubBase, EventSubChannelHypeTrainEndV2Event, EventSubSubscription } from "@twurple/eventsub-base"
import { rawDataSymbol } from "@twurple/common"
import { HelixEventSubSubscription, extractUserId } from "@twurple/api"

type EventSubChannelHypeTrainEndV2EventData = EventSubChannelHypeTrainEndV2Event[typeof rawDataSymbol]

class HypeTrainEndV2WorkAround extends EventSubSubscription<EventSubChannelHypeTrainEndV2Event> {
	/** @protected */ readonly _cliName = "hype-train-end"
	constructor(
		handler: (data: EventSubChannelHypeTrainEndV2Event) => void,
		client: EventSubBase,
		private readonly _userId: string
	) {
		//@ts-ignore - Ignore us using an internal constructor
		super(handler, client)
	}
	get id(): string {
		return `channel.hype_train.end.v2.${this._userId}`
	}
	get authUserId(): string | null {
		return this._userId
	}
	protected transformData(data: EventSubChannelHypeTrainEndV2EventData): EventSubChannelHypeTrainEndV2Event {
		//@ts-ignore - Ignore us using an internal constructor
		const result = new EventSubChannelHypeTrainEndV2Event(data, this._client._apiClient)
		return result
	}

	protected async _subscribe(): Promise<HelixEventSubSubscription> {
		return await this._client._apiClient.eventSub.subscribeToChannelHypeTrainEndV2Events(
			this._userId,
			await this._getTransportOptions()
		)
	}
}

export function setupHypeTrains() {
	const logger = usePluginLogger()

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
		name: "Hype Train Level Reached",
		icon: "mdi mdi-train-car-caboose",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				level: {
					type: Range,
					name: "Level",
					default: { min: 1 },
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
			return Range.inRange(config.level, context.level)
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
					default: { min: 1 },
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
			return Range.inRange(config.level, context.level)
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
		const perf = startPerfTime(`HypeTrains`)

		service.eventsub.onChannelHypeTrainBeginV2(channel.twitchId, (event) => {
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

		//@ts-ignore - ignore using a private function
		service.eventsub._genericSubscribe(
			HypeTrainEndV2WorkAround,
			(event) => {
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
			},
			service.eventsub,
			extractUserId(channel.twitchId)
		)

		/*service.eventsub.onChannelHypeTrainEndV2(channel.twitchId, (event) => {
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
		})*/

		service.eventsub.onChannelHypeTrainProgressV2(channel.twitchId, (event) => {
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

		const hypeTrain = await channel.apiClient.hypeTrain.getHypeTrainStatusForBroadcaster(channel.twitchId)

		if (hypeTrain.current) {
			//Hypetrain is running
			hypeTrainLevel.value = hypeTrain.current.level
			hypeTrainTotal.value = hypeTrain.current.total
			hypeTrainGoal.value = hypeTrain.current.goal
			hypeTrainProgress.value = hypeTrain.current.progress
			hypeTrainExists.value = true
		} else {
			hypeTrainLevel.value = 0
			hypeTrainProgress.value = 0
			hypeTrainGoal.value = 0
			hypeTrainTotal.value = 0
			hypeTrainExists.value = false
		}

		perf.stop(logger)
	})
}
