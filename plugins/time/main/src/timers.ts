import {
	defineAction,
	defineTrigger,
	onProfilesChanged,
	registerSchemaCompare,
	registerSchemaExpose,
	scheduleReactiveTrigger,
} from "castmate-core"
import { Timer, getTimeRemaining, isTimer } from "castmate-plugin-time-shared"
import { Duration, ValueCompareOperator } from "castmate-schema"

export function compareTimer(lhs: Timer, rhs: any, operator: ValueCompareOperator) {
	if (typeof rhs == "number") {
		const remaining = getTimeRemaining(lhs)
		const difference = rhs - remaining

		if (operator == "equal") {
			return difference == 0
		} else if (operator == "notEqual") {
			return difference != 0
		} else if (operator == "greaterThan") {
			scheduleReactiveTrigger(Date.now() - difference)
			return difference < 0
		} else if (operator == "greaterThanEq") {
			scheduleReactiveTrigger(Date.now() - difference)
			return difference <= 0
		} else if (operator == "lessThan") {
			scheduleReactiveTrigger(Date.now() + difference)
			return difference > 0
		} else if (operator == "lessThanEq") {
			scheduleReactiveTrigger(Date.now() + difference)
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
			scheduleReactiveTrigger(Date.now() - difference)
			return difference < 0
		} else if (operator == "greaterThanEq") {
			scheduleReactiveTrigger(Date.now() - difference)
			return difference <= 0
		} else if (operator == "lessThan") {
			scheduleReactiveTrigger(Date.now() + difference)
			return difference > 0
		} else if (operator == "lessThanEq") {
			scheduleReactiveTrigger(Date.now() + difference)
			return difference >= 0
		}
	}
	return false
}

registerSchemaCompare(Timer, compareTimer)

interface RepeatingTimer {
	delay?: NodeJS.Timeout
	timer?: NodeJS.Timeout
}

export function setupTimers() {
	function stopRepeatingTimer(repeat: RepeatingTimer) {
		if (repeat.delay) {
			clearTimeout(repeat.delay)
		}

		if (repeat.timer) {
			clearInterval(repeat.timer)
		}
	}

	function setRepeatingTimer(
		profileId: string,
		triggerId: string,
		interval: Duration,
		delay?: Duration
	): RepeatingTimer {
		const result: RepeatingTimer = {}

		if (delay) {
			result.delay = setTimeout(() => {
				result.delay = undefined
				repeat({ profileId, triggerId })
				result.timer = setInterval(() => {
					repeat({ profileId, triggerId })
				}, interval * 1000)
			}, delay * 1000)
		} else {
			repeat({ profileId, triggerId })
			result.timer = setInterval(() => {
				repeat({ profileId, triggerId })
			}, interval * 1000)
		}

		return result
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
				triggerId: { type: String, required: true },
				profileId: { type: String, required: true },
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
				if (repeatingTimers.has(slug)) continue
				repeatingTimers.set(
					slug,
					setRepeatingTimer(prof.id, trigger.id, trigger.config.interval, trigger.config.delay)
				)
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
}
