import { Duration, formatDuration } from "../data/duration"
import { SchemaBase, registerType } from "../schema"
import { registerRemoteDataDeserializer } from "../template/remote-templates"

interface TimerBase {
	[Symbol.toPrimitive](hint: "default" | "string" | "number"): any
}

interface RunningTimerData {
	/**
	 * Date.now() timestamp the timer will run out
	 */
	endTime: number
}

interface RunningTimer extends TimerBase, RunningTimerData {}

interface PausedTimerData {
	/**
	 * Seconds remaining
	 */
	remainingTime: number
}

interface PausedTimer extends PausedTimerData, TimerBase {}

type TimerData = RunningTimerData | PausedTimerData

export type Timer = RunningTimer | PausedTimer

const TimerSymbol = Symbol()
export type TimerFactory = {
	factoryCreate(): Timer
	[TimerSymbol]: "Timer"
	fromDate(date: Date): Timer
	fromDuration(duration: Duration, paused?: boolean): Timer
	scheduleFunc(timer: Timer, func: () => any, advance?: number): NodeJS.Timeout | undefined
}

function timerToPrimitive(hint: "default" | "string" | "number", timer: Timer) {
	if (hint == "default" || hint == "string") {
		return formatDuration(getTimeRemaining(timer), 0)
	}
}

export const Timer: TimerFactory = {
	factoryCreate(): Timer {
		return wrapTimerData({
			remainingTime: 0,
		})
	},
	fromDate(date: Date): Timer {
		return wrapTimerData({
			endTime: date.getTime(),
		})
	},
	fromDuration(duration: Duration, paused: boolean = false): Timer {
		if (!paused) {
			return wrapTimerData({
				endTime: Date.now() + duration * 1000,
			})
		} else {
			return wrapTimerData({
				remainingTime: duration,
			})
		}
	},
	scheduleFunc(timer, func, advance) {
		if (!isTimerStarted(timer)) return undefined

		const remaining = getTimeRemaining(timer) - (advance ?? 0)

		if (remaining <= 0) return undefined

		return setTimeout(func, remaining * 1000)
	},
	[TimerSymbol]: "Timer",
}

export function pauseTimer(timer: Timer): Timer {
	if ("remainingTime" in timer) return timer

	return wrapTimerData({
		remainingTime: getTimeRemaining(timer),
	})
}

export function startTimer(timer: Timer): Timer {
	if ("endTime" in timer) return timer

	const endTime = Date.now() + timer.remainingTime * 1000

	return wrapTimerData({
		endTime,
	})
}

export function isTimerStarted(timer: Timer): timer is RunningTimer {
	return "endTime" in timer && getTimeRemaining(timer) > 0
}

export function setTimer(timer: Timer, duration: Duration): Timer {
	if ("endTime" in timer) {
		return wrapTimerData({
			endTime: Date.now() + duration * 1000,
		})
	} else {
		return wrapTimerData({
			remainingTime: duration,
		})
	}
}

export function offsetTimer(timer: Timer, duration: Duration): Timer {
	if ("endTime" in timer) {
		const now = Date.now()
		//Handle the case that the timer has been left running past 0
		if (timer.endTime > now) {
			return wrapTimerData({
				endTime: timer.endTime + duration * 1000,
			})
		} else {
			return wrapTimerData({
				endTime: now + duration * 1000,
			})
		}
	} else {
		return wrapTimerData({
			remainingTime: timer.remainingTime + duration,
		})
	}
}

export function getTimeRemaining(timer: Timer): Duration {
	if ("endTime" in timer) {
		const remainingMs = Math.max(timer.endTime - Date.now(), 0)
		return remainingMs / 1000
	} else {
		return timer.remainingTime
	}
}

export function isTimer(value: any): value is Timer {
	if (value == null) return false
	if (typeof value != "object") return false
	if ("endTime" in value || "remainingTime" in value) return true
	return false
}

export interface SchemaTimer extends SchemaBase<Timer> {
	type: TimerFactory
}

declare module "../schema" {
	interface SchemaTypeMap {
		Timer: [SchemaTimer, Timer]
	}
}

registerType("Timer", {
	constructor: Timer,
	icon: "mdi mdi-timer-outline",
	canBeVariable: true,
	async deserialize(value, schema): Promise<Timer> {
		if (isTimer(value)) {
			if ("endTime" in value) {
				return wrapTimerData({
					endTime: value.endTime,
				})
			} else if ("remainingTime" in value) {
				return wrapTimerData({
					remainingTime: value.remainingTime,
				})
			}
		}
		return Timer.factoryCreate()
	},
	comparisonTypes: [
		{
			otherType: Duration,
			inequalities: true,
		},
	],
})

function wrapTimerData(data: TimerData): Timer {
	return {
		...data,
		[Symbol.toPrimitive](hint) {
			return timerToPrimitive(hint, this)
		},
	}
}

registerRemoteDataDeserializer("Timer", (data, context) => {
	const timer = wrapTimerData(data.data as TimerData)

	if (isTimerStarted(timer)) {
		const remaining = getTimeRemaining(timer)
		context.scheduleReEval(remaining - Math.floor(remaining))
	}

	return String(timer)
})
