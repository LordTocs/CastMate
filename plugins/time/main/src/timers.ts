import {
	ReactiveEffect,
	autoRerun,
	defineAction,
	defineTrigger,
	onProfilesChanged,
	registerSchemaCompare,
	registerSchemaExpose,
	scheduleReactiveTrigger,
	usePluginLogger,
} from "castmate-core"
import { VariableManager } from "castmate-plugin-variables-main"
import { Duration, ValueCompareOperator, Timer, getTimeRemaining, isTimer, isTimerStarted } from "castmate-schema"

//Schedules a reactive effect to wake up at a certain duration remaining.
function scheduleTimerWakeup(timer: Timer, duration: Duration) {
	if (!isTimerStarted(timer)) return

	const remaining = getTimeRemaining(timer)

	if (remaining <= duration) return //Timers only go down, so we've already passed this threshold no need to wake up

	//Always wake up about 5 milliseconds late to allow for deviation in timer calculations
	const difference = remaining - duration + 0.005

	if (difference <= 0) return

	scheduleReactiveTrigger(Date.now() + difference * 1000)
}

export function compareTimer(lhs: Timer, rhs: any, operator: ValueCompareOperator) {
	if (typeof rhs == "number") {
		const remaining = getTimeRemaining(lhs)
		const difference = rhs - remaining

		scheduleTimerWakeup(lhs, rhs)

		if (operator == "equal") {
			return difference == 0
		} else if (operator == "notEqual") {
			return difference != 0
		} else if (operator == "greaterThan") {
			return difference < 0
		} else if (operator == "greaterThanEq") {
			return difference <= 0
		} else if (operator == "lessThan") {
			return difference > 0
		} else if (operator == "lessThanEq") {
			return difference >= 0
		}
	} else if (isTimer(rhs)) {
		const lRemaining = getTimeRemaining(lhs)
		const rRemaining = getTimeRemaining(rhs)

		const difference = rRemaining - lRemaining

		if (operator == "equal") {
			return difference == 0
		} else if (operator == "notEqual") {
			return difference != 0
		} else if (operator == "greaterThan") {
			//scheduleReactiveTrigger(Date.now() - difference)
			return difference < 0
		} else if (operator == "greaterThanEq") {
			//scheduleReactiveTrigger(Date.now() - difference)
			return difference <= 0
		} else if (operator == "lessThan") {
			//scheduleReactiveTrigger(Date.now() + difference)
			return difference > 0
		} else if (operator == "lessThanEq") {
			//scheduleReactiveTrigger(Date.now() + difference)
			return difference >= 0
		}
	}
	return false
}

registerSchemaCompare(Timer, compareTimer)

interface RepeatingTimer {
	delay?: NodeJS.Timeout
	delayTime?: Duration
	delayWaited?: boolean
	timer?: NodeJS.Timeout
	timerInterval?: Duration
}

function hasDelayed(timer: RepeatingTimer) {
	return timer.delayWaited == true
}

export function setupTimers() {
	const logger = usePluginLogger()

	function stopRepeatingTimer(repeat: RepeatingTimer) {
		if (repeat.delay) {
			clearTimeout(repeat.delay)
		}

		if (repeat.timer) {
			clearInterval(repeat.timer)
		}
	}

	function setTimer(timer: RepeatingTimer, profileId: string, triggerId: string, validInterval: Duration) {
		if (timer.timerInterval != validInterval) {
			timer.delayWaited = true
			timer.timerInterval = validInterval

			if (timer.timer) {
				clearInterval(timer.timer)
				delete timer.timer
			}

			timer.timer = setInterval(() => {
				timer.delayWaited = true
				repeat({ profileId, triggerId })
			}, validInterval * 1000)
		}
	}

	function setDelay(
		timer: RepeatingTimer,
		profileId: string,
		triggerId: string,
		delay: Duration,
		validInterval: Duration
	) {
		if (timer.delayTime != delay) {
			timer.delayTime = delay

			if (timer.delay) {
				clearTimeout(timer.delay)
				delete timer.delay
			}

			timer.delay = setTimeout(() => {
				delete timer.delay
				delete timer.delayTime
				repeat({ profileId, triggerId })

				setTimer(timer, profileId, triggerId, validInterval)
			}, delay * 1000)
		}
	}

	function updateTimer(
		timer: RepeatingTimer,
		profileId: string,
		triggerId: string,
		interval: Duration,
		delay?: Duration
	) {
		const validInterval = Math.max(interval ?? 1, 0.1)

		if (delay && !hasDelayed(timer)) {
			setDelay(timer, profileId, triggerId, delay, validInterval)
		} else {
			setTimer(timer, profileId, triggerId, validInterval)
		}
	}

	const repeat = defineTrigger({
		id: "repeat",
		name: "Repeat",
		description: "Repeatedly triggers at a set time interval",
		icon: "mdi mdi-clock",
		config: {
			type: Object,
			properties: {
				delay: { type: Duration, name: "Delay" },
				interval: { type: Duration, name: "Interval", required: true, default: 30 },
			},
		},
		context: {
			type: Object,
			properties: {
				triggerId: { type: String, required: true, view: false },
				profileId: { type: String, required: true, view: false },
			},
		},
		async handle(config, context, mapping) {
			if (mapping.profileId != context.profileId) return false
			if (mapping.triggerId != context.triggerId) return false
			return true
		},
	})

	const repeatingTimers = new Map<string, RepeatingTimer>()

	onProfilesChanged((activeProfiles, inactiveProfiles) => {
		for (const prof of activeProfiles) {
			for (const trigger of prof.iterTriggers(repeat)) {
				const slug = `${prof.id}.${trigger.id}`
				let timer = repeatingTimers.get(slug)
				if (!timer) {
					timer = {}
					repeatingTimers.set(slug, timer)
				}

				updateTimer(timer, prof.id, trigger.id, trigger.config?.interval, trigger.config?.delay ?? 0)
			}
		}

		for (const prof of inactiveProfiles) {
			for (const trigger of prof.iterTriggers(repeat)) {
				const slug = `${prof.id}.${trigger.id}`
				const timer = repeatingTimers.get(slug)
				if (timer) {
					stopRepeatingTimer(timer)
					repeatingTimers.delete(slug)
				}
			}
		}
	})

	const timerTrigger = defineTrigger({
		id: "timer",
		name: "Timer",
		icon: "mdi mdi-timer",
		config: {
			type: Object,
			properties: {
				timer: {
					type: String,
					name: "Timer",
					required: true,
					async enum() {
						return VariableManager.getInstance()
							.variableDefinitions.filter((v) => v.schema.type == Timer)
							.map((v) => v.id)
					},
				},
				offset: {
					type: Duration,
					name: "Time Remaining",
					required: true,
					default: 0,
				},
			},
		},
		context: {
			type: Object,
			properties: {
				triggerId: { type: String, required: true, view: false },
				profileId: { type: String, required: true, view: false },
			},
		},
		async handle(config, context, mapping) {
			if (mapping.profileId != context.profileId) return false
			if (mapping.triggerId != context.triggerId) return false
			return true
		},
	})

	interface TimerTriggerer {
		profileId: string
		triggerId: string
		timeout?: NodeJS.Timeout
		effect?: ReactiveEffect
	}

	function disposeTimerTriggerer(triggerer: TimerTriggerer) {
		if (triggerer.timeout) {
			clearTimeout(triggerer.timeout)
			triggerer.timeout = undefined
		}

		if (triggerer.effect) {
			triggerer.effect.dispose()
			triggerer.effect = undefined
		}
	}

	let timerTriggerers: TimerTriggerer[] = []

	onProfilesChanged(async (activeProfiles, inactiveProfiles) => {
		for (const triggerer of timerTriggerers) {
			disposeTimerTriggerer(triggerer)
		}

		timerTriggerers = []

		for (const prof of activeProfiles) {
			for (const trigger of prof.iterTriggers(timerTrigger)) {
				const triggerer: TimerTriggerer = {
					profileId: prof.id,
					triggerId: trigger.id,
				}

				timerTriggerers.push(triggerer)

				triggerer.effect = await autoRerun(() => {
					logger.log("Reorganizing Timer Trigger")
					const timer = VariableManager.getInstance().getVariable<Timer>(trigger.config.timer)
					if (!timer) return
					if (!isTimer(timer.ref.value)) return

					if (triggerer.timeout) {
						clearTimeout(triggerer.timeout)
						triggerer.timeout = undefined
					}

					if (!isTimerStarted(timer.ref.value)) return

					const remaining = getTimeRemaining(timer.ref.value)
					const timeTilTrigger = remaining - trigger.config.offset
					if (timeTilTrigger > 0) {
						logger.log("Setting Timer Timeout", timeTilTrigger)
						triggerer.timeout = setTimeout(() => {
							timerTrigger({
								profileId: triggerer.profileId,
								triggerId: triggerer.triggerId,
							})
						}, timeTilTrigger * 1000)
					}
				})
			}
		}
	})
}
