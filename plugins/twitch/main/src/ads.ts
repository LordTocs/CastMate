import {
	Service,
	defineAction,
	defineState,
	defineTrigger,
	measurePerf,
	measurePerfFunc,
	onProfilesChanged,
	startPerfTime,
	usePluginLogger,
} from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { CommercialLength } from "@twurple/api"
import { onChannelAuth } from "./api-harness"
import { Duration, Timer, getTimeRemaining, isTimerStarted } from "castmate-schema"

export function setupAds() {
	const logger = usePluginLogger("twitch-ad")

	defineAction({
		id: "runAd",
		name: "Run Ad",
		description: "Run an Ad. You should probably use the ad manager instead.",
		icon: "mdi mdi-advertisements",
		duration: {
			propDependencies: "duration",
			async callback(config) {
				return {
					dragType: "fixed",
					duration: config.duration,
				}
			},
		},
		config: {
			type: Object,
			properties: {
				duration: { type: Number, name: "Duration", required: true, enum: [30, 60, 90, 120, 150, 180] },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await TwitchAccount.channel.apiClient.channels.startChannelCommercial(
				TwitchAccount.channel.config.twitchId,
				config.duration as CommercialLength
			)
		},
	})

	const adSnoozes = defineState("adSnoozes", {
		type: Number,
		name: "Ad Snoozes",
		default: 0,
		required: true,
	})

	const inAdBreak = defineState("inAdBreak", {
		type: Boolean,
		name: "In Ad Break",
		default: false,
		required: true,
	})

	const snoozeRefreshTimer = defineState("adSnoozeRefresh", {
		type: Timer,
		name: "Snooze Refresh",
		required: true,
	})

	const prerollFreeTime = defineState("prerollFreeTime", {
		type: Timer,
		name: "Preroll Free Time",
		required: true,
	})

	const nextAdDuration = defineState("nextAdDuration", {
		type: Duration,
		name: "Next Ad Duration",
		required: true,
	})

	const nextAdTimer = defineState("nextAdTimer", {
		type: Timer,
		name: "Next Ad Time",
		required: true,
	})

	const adTimer = defineState("adTimer", {
		type: Timer,
		name: "Current Ad Timer",
		required: true,
	})

	const queryAdSchedule = measurePerfFunc(async function (validation = false) {
		try {
			logger.log("Starting Ad Schedule Query", validation, new Date().toLocaleString())

			const schedule = await TwitchAccount.channel.apiClient.channels.getAdSchedule(
				TwitchAccount.channel.twitchId
			)

			logger.log(
				"Got Ad Schedule",
				schedule.lastAdDate?.toLocaleString() ?? "NoLast",
				" -> ",
				schedule.nextAdDate?.toLocaleString() ?? "NoNext",
				schedule.snoozeCount
			)

			nextAdDuration.value = schedule.duration
			nextAdTimer.value = schedule.nextAdDate ? Timer.fromDate(schedule.nextAdDate) : Timer.factoryCreate()

			if (schedule.prerollFreeTime <= 0) {
				prerollFreeTime.value = Timer.factoryCreate()
			} else {
				prerollFreeTime.value = Timer.fromDuration(schedule.prerollFreeTime)
			}

			const oldSnoozes = adSnoozes.value

			adSnoozes.value = schedule.snoozeCount
			snoozeRefreshTimer.value = schedule.snoozeRefreshDate
				? Timer.fromDate(schedule.snoozeRefreshDate)
				: Timer.factoryCreate()

			if (isTimerStarted(snoozeRefreshTimer.value)) {
				logger.log("Starting Snooze Query Timer", schedule.snoozeRefreshDate?.toLocaleString())

				if (snoozeQueryTimeout) clearTimeout(snoozeQueryTimeout)

				snoozeQueryTimeout = Timer.scheduleFunc(snoozeRefreshTimer.value, () => queryAdSchedule())

				if (!snoozeQueryTimeout) logger.log("Failed to Schedule Snooze Query", snoozeRefreshTimer.value)
			}

			//Adjust the schedule if necessary
			if (!validation || adSnoozes.value < oldSnoozes) {
				//Only adjust the schedule if our snooze count changed for validation calls.
				//This should prevent issues where the user's system clock is ahead of the server clock.
				if (validation) {
					logger.log("SNOOZE DETECTED, REQUERY")
				}

				scheduleAdTriggers(scheduledAdTriggers)
			}

			logger.log("Finished Ad Schedule Query")
		} catch (err) {
			logger.error("Error Querying Ad Schedule", err)
		}
	}, "queryAdSchedule")

	interface ScheduledAdTrigger {
		advance: Duration
		timeout?: NodeJS.Timeout | undefined
	}

	let scheduledAdTriggers: ScheduledAdTrigger[] = []
	let validationTimeout: NodeJS.Timeout | undefined = undefined
	let snoozeQueryTimeout: NodeJS.Timeout | undefined = undefined

	onProfilesChanged((activeProfiles, inactiveProfiles) => {
		const scheduledTriggers: ScheduledAdTrigger[] = []

		for (const prof of activeProfiles) {
			for (const trigger of prof.iterTriggers(adSchedule)) {
				if (scheduledTriggers.find((st) => st.advance == trigger.config.advance)) {
					continue
				}

				scheduledTriggers.push({
					advance: trigger.config.advance,
				})
			}
		}

		scheduleAdTriggers(scheduledTriggers)
	})

	function scheduleValidationQuery(advance: Duration) {
		if (advance <= 0 || !isTimerStarted(nextAdTimer.value)) return

		//Issue a schedule validation check 1s before the next trigger
		const validationAdvance = advance + 5
		if (validationAdvance <= 0) return

		const validationQueryTime = new Date(nextAdTimer.value.endTime - validationAdvance * 1000)

		logger.log("Scheduling Validation Query", advance, validationQueryTime.toLocaleString())

		if (validationTimeout) {
			clearTimeout(validationTimeout)
		}

		validationTimeout = Timer.scheduleFunc(nextAdTimer.value, () => queryAdSchedule(true), validationAdvance)

		if (!validationTimeout) {
			logger.error("Unable to schedule validation", nextAdTimer.value)
		}
	}

	function scheduleAdTriggers(newTriggers: ScheduledAdTrigger[]) {
		logger.log("Starting Ad Scheduling")
		for (const st of scheduledAdTriggers) {
			if (st.timeout) {
				clearTimeout(st.timeout)
				st.timeout = undefined
			}
		}

		if (validationTimeout) {
			clearTimeout(validationTimeout)
		}

		scheduledAdTriggers = newTriggers

		scheduledAdTriggers.sort((a, b) => {
			return b.advance - a.advance
		})

		logger.log(scheduledAdTriggers)

		if (!isTimerStarted(nextAdTimer.value)) {
			logger.log("No Triggers Scheduled, nextAdTimer is stopped: ", nextAdTimer.value)
			return
		}

		const nextAdTime = getTimeRemaining(nextAdTimer.value)
		logger.log("Next Ad Time: ", new Date(Date.now() + nextAdTime * 1000).toLocaleString())
		let soonestAdvance = -1

		for (let i = 0; i < scheduledAdTriggers.length; ++i) {
			const st = scheduledAdTriggers[i]

			const triggerTime = nextAdTime - st.advance
			const triggerDate = new Date(Date.now() + triggerTime * 1000)

			if (triggerTime <= 0) {
				//This trigger already happened
				logger.log("Skipping Ad Trigger - Already Happened", st.advance)
				continue
			}

			soonestAdvance = Math.max(st.advance, soonestAdvance)

			logger.log("Scheduling Ad Trigger", st.advance, triggerDate.toLocaleString())

			const nextAdvance = scheduledAdTriggers[i + 1]?.advance ?? 0

			st.timeout = Timer.scheduleFunc(
				nextAdTimer.value,
				() => {
					logger.log("Attempting Ad Schedule Trigger", st.advance, triggerDate.toLocaleString())

					adSchedule({
						advance: st.advance,
					})

					//Schedule next validation query
					scheduleValidationQuery(nextAdvance)
				},
				st.advance
			)

			if (!st.timeout) {
				logger.error("Failed to Schedule Ad Trigger", st.advance, nextAdTimer.value)
			}
		}

		scheduleValidationQuery(soonestAdvance)

		logger.log("Finished Ad Scheduling")
	}

	defineAction({
		id: "snoozeAds",
		name: "Snooze Ads",
		description: "Snoozes the next ad if you have any snoozes remaining.",
		icon: "mdi mdi-sleep",
		config: {
			type: Object,
			properties: {},
		},
		async invoke(config, contextData, abortSignal) {
			if (!TwitchAccount.channel.isAuthenticated) return
			if (adSnoozes.value == 0) return

			await TwitchAccount.channel.apiClient.channels.snoozeNextAd(TwitchAccount.channel.twitchId)
			await queryAdSchedule()
		},
	})

	const adStarted = defineTrigger({
		id: "adStarted",
		name: "Ad Started",
		description: "An ad break has started",
		icon: "mdi mdi-advertisements",
		config: {
			type: Object,
			properties: {},
		},
		context: {
			type: Object,
			properties: {
				duration: { type: Duration, required: true },
			},
		},
		async handle(config, context, mapping) {
			return true
		},
	})

	const adEnded = defineTrigger({
		id: "adEnded",
		name: "Ad Ended",
		description: "An ad break has finished",
		icon: "mdi mdi-advertisements",
		config: {
			type: Object,
			properties: {},
		},
		context: {
			type: Object,
			properties: {
				duration: { type: Duration, required: true },
			},
		},
		async handle(config, context, mapping) {
			return true
		},
	})

	const adSchedule = defineTrigger({
		id: "adSchedule",
		name: "Ad Schedule",
		description: "Runs in advance of an scheduled ad.",
		icon: "mdi mdi-advertisements",
		config: {
			type: Object,
			properties: {
				advance: { type: Duration, name: "Advance", required: true, default: 60 },
			},
		},
		context: {
			type: Object,
			properties: {
				advance: { type: Duration, required: true },
			},
		},
		async handle(config, context, mapping) {
			return config.advance == context.advance
		},
	})

	onChannelAuth(async (channel, service) => {
		logger.log("Channel Auth Query")
		await queryAdSchedule()

		service.eventsub.onStreamOnline(channel.twitchId, async (event) => {
			setTimeout(() => {
				//Wait a little bit after the stream comes online to query the ad schedule since we don't seem to get info on first startup
				logger.log("Querying Initial Ad Schedule")
				queryAdSchedule()
			}, 60 * 1000)
		})

		service.eventsub.onChannelAdBreakBegin(channel.twitchId, async (event) => {
			adStarted({ duration: event.durationSeconds })

			inAdBreak.value = true
			adTimer.value = Timer.fromDuration(event.durationSeconds)

			setTimeout(() => {
				adEnded({ duration: event.durationSeconds })
				inAdBreak.value = false
				adTimer.value = Timer.factoryCreate()
			}, event.durationSeconds * 1000)

			await queryAdSchedule()
		})
	})
}
