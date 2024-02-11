import { Duration, SchemaBase, registerType } from "castmate-schema"

interface TimerBase {}

interface RunningTimer extends TimerBase {
	/**
	 * Date.now() timestamp the timer will run out
	 */
	endTime: number
}

interface PausedTimer extends TimerBase {
	/**
	 * Seconds remaining
	 */
	remainingTime: number
}

export type Timer = RunningTimer | PausedTimer

const TimerSymbol = Symbol()
export type TimerFactory = {
	factoryCreate(): Timer
	[TimerSymbol]: "Timer"
}

export const Timer: TimerFactory = {
	factoryCreate(): Timer {
		return { remainingTime: 0 }
	},
	[TimerSymbol]: "Timer",
}

export function pauseTimer(timer: Timer): Timer {
	if ("remainingTime" in timer) return timer

	return {
		remainingTime: getTimeRemaining(timer),
	}
}

export function startTimer(timer: Timer): Timer {
	if ("endTime" in timer) return timer

	const endTime = Date.now() + timer.remainingTime * 1000

	return {
		endTime,
	}
}

export function isTimerStarted(timer: Timer) {
	return "endTime" in timer && getTimeRemaining(timer) > 0
}

export function setTimer(timer: Timer, duration: Duration): Timer {
	if ("endTime" in timer) {
		return { endTime: Date.now() + duration * 1000 }
	} else {
		return { remainingTime: duration }
	}
}

export function offsetTimer(timer: Timer, duration: Duration): Timer {
	if ("endTime" in timer) {
		const now = Date.now()
		//Handle the case that the timer has been left running past 0
		if (timer.endTime > now) {
			return {
				endTime: timer.endTime + duration * 1000,
			}
		} else {
			return {
				endTime: now + duration * 1000,
			}
		}
	} else {
		return {
			remainingTime: timer.remainingTime + duration * 1000,
		}
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

export interface SchemaTimer extends SchemaBase<Timer> {}

declare module "castmate-schema" {
	interface SchemaTimer {
		Timer: [SchemaTimer, Timer]
	}
}

registerType("Timer", {
	constructor: Timer,
	canBeVariable: true,
})
