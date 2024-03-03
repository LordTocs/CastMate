import { Service, defineAction, defineState, defineTrigger, onProfilesChanged } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { CommercialLength } from "@twurple/api"
import { onChannelAuth } from "./api-harness"
import { Duration, Timer, getTimeRemaining, isTimerStarted } from "castmate-schema"

export function setupAds() {
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

	async function queryAdSchedule() {
		const schedule = await TwitchAccount.channel.apiClient.channels.getAdSchedule(TwitchAccount.channel.twitchId)

		nextAdDuration.value = schedule.duration
		nextAdTimer.value = Timer.fromDate(schedule.nextAdDate)

		if (schedule.prerollFreeTime <= 0) {
			prerollFreeTime.value = Timer.factoryCreate()
		} else {
			prerollFreeTime.value = Timer.fromDuration(schedule.prerollFreeTime)
		}

		adSnoozes.value = schedule.snoozeCount
		snoozeRefreshTimer.value = Timer.fromDate(schedule.snoozeRefreshDate)

		//Adjust the schedule if necessary
		scheduleAdTriggers(scheduledAdTriggers)
	}

	interface ScheduledAdTrigger {
		advance: Duration
		timeout?: NodeJS.Timeout | undefined
	}

	let scheduledAdTriggers: ScheduledAdTrigger[] = []

	onProfilesChanged((activeProfiles, inactiveProfiles) => {
		if (!isTimerStarted(nextAdTimer.value)) return
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

	function scheduleAdTriggers(newTriggers: ScheduledAdTrigger[]) {
		for (const st of scheduledAdTriggers) {
			if (st.timeout) {
				clearTimeout(st.timeout)
				st.timeout = undefined
			}
		}

		scheduledAdTriggers = newTriggers

		const nextAdTime = getTimeRemaining(nextAdTimer.value)
		let soonestTriggerTime = Number.POSITIVE_INFINITY

		for (const st of scheduledAdTriggers) {
			const triggerTime = nextAdTime - st.advance
			if (triggerTime <= 0) continue

			soonestTriggerTime = Math.min(soonestTriggerTime)

			st.timeout = setTimeout(() => {
				adSchedule({
					advance: st.advance,
				})
			}, triggerTime * 1000)
		}

		if (soonestTriggerTime < Number.POSITIVE_INFINITY) {
			//Issue a schedule validation check 1s before the next trigger
			const validationTime = soonestTriggerTime - 1
			if (validationTime > 0) {
				setTimeout(async () => {
					await queryAdSchedule()
				}, validationTime * 1000)
			}
		}
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
		await queryAdSchedule()

		service.eventsub.onStreamOnline(channel.twitchId, async (event) => {
			await queryAdSchedule()
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
