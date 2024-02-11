import { Duration, SchemaBase, formatDuration, registerType } from "castmate-schema"

interface TimerBase {
	[Symbol.toPrimitive](hint: "default" | "string" | "number"): any
}

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

function timerToPrimitive(hint: "default" | "string" | "number", timer: Timer) {
	if (hint == "default" || hint == "string") {
		return formatDuration(getTimeRemaining(timer), 0)
	}
}

export const Timer: TimerFactory = {
	factoryCreate(): Timer {
		return {
			remainingTime: 0,
			[Symbol.toPrimitive](hint) {
				return timerToPrimitive(hint, this)
			},
		}
	},
	[TimerSymbol]: "Timer",
}

export function pauseTimer(timer: Timer): Timer {
	if ("remainingTime" in timer) return timer

	return {
		remainingTime: getTimeRemaining(timer),
		[Symbol.toPrimitive](hint) {
			return timerToPrimitive(hint, this)
		},
	}
}

export function startTimer(timer: Timer): Timer {
	if ("endTime" in timer) return timer

	const endTime = Date.now() + timer.remainingTime * 1000

	return {
		endTime,
		[Symbol.toPrimitive](hint) {
			return timerToPrimitive(hint, this)
		},
	}
}

export function isTimerStarted(timer: Timer) {
	return "endTime" in timer && getTimeRemaining(timer) > 0
}

export function setTimer(timer: Timer, duration: Duration): Timer {
	if ("endTime" in timer) {
		return {
			endTime: Date.now() + duration * 1000,
			[Symbol.toPrimitive](hint) {
				return timerToPrimitive(hint, this)
			},
		}
	} else {
		return {
			remainingTime: duration,
			[Symbol.toPrimitive](hint) {
				return timerToPrimitive(hint, this)
			},
		}
	}
}

export function offsetTimer(timer: Timer, duration: Duration): Timer {
	if ("endTime" in timer) {
		const now = Date.now()
		//Handle the case that the timer has been left running past 0
		if (timer.endTime > now) {
			return {
				endTime: timer.endTime + duration * 1000,
				[Symbol.toPrimitive](hint) {
					return timerToPrimitive(hint, this)
				},
			}
		} else {
			return {
				endTime: now + duration * 1000,
				[Symbol.toPrimitive](hint) {
					return timerToPrimitive(hint, this)
				},
			}
		}
	} else {
		return {
			remainingTime: timer.remainingTime + duration * 1000,
			[Symbol.toPrimitive](hint) {
				return timerToPrimitive(hint, this)
			},
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
	async deserialize(value, schema): Promise<Timer | undefined> {
		if (isTimer(value)) {
			if ("endTime" in value) {
				return {
					endTime: value.endTime,
					[Symbol.toPrimitive](hint) {
						return timerToPrimitive(hint, this)
					},
				}
			} else if ("remainingTime" in value) {
				return {
					remainingTime: value.remainingTime,
					[Symbol.toPrimitive](hint) {
						return timerToPrimitive(hint, this)
					},
				}
			}
		}
		return undefined
	},
})
