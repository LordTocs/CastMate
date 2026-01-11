import { isPromise } from "util/types"
import { Logger, usePluginLogger } from "../logging/logging"
import { onProfilesChanged } from "../plugins/plugin"
import { TriggerFunc } from "../queue-system/trigger"
import { declareSchema, Duration, getTimeRemaining, isTimerStarted, Schema, SchemaType, Timer } from "castmate-schema"
import { ReactiveRef, runOnChange } from "../reactivity/reactivity"

export interface PerfTimer {
	name: string
	startTime: number
	stop(logger: Logger): void
}

export function startPerfTime(name: string): PerfTimer {
	return {
		name,
		startTime: Date.now(),
		stop(logger) {
			logger.log("Completed ", name, (Date.now() - this.startTime) / 1000, "seconds")
		},
	}
}

export function measurePerf<This, T extends (this: This, ...args: any[]) => any>(
	original: T,
	context: ClassMethodDecoratorContext<T>
) {
	const logger = usePluginLogger("perf")

	function replacement(this: This, ...args: Parameters<T>): ReturnType<T> {
		const perf = startPerfTime(String(context.name))

		let result: ReturnType<T>
		try {
			result = original.call(this, ...args)

			if (isPromise(result)) {
				//@ts-ignore Type system too stupid again.
				return (async () => {
					try {
						return await result
					} finally {
						perf.stop(logger)
					}
				})()
			} else {
				perf.stop(logger)
				return result
			}
		} catch (err) {
			perf.stop(logger)
			throw err
		}
	}

	return replacement
}

export function measurePerfFunc<T extends (...args: any[]) => any>(func: T, name?: string) {
	const logger = usePluginLogger("perf")
	return (...args: Parameters<T>): ReturnType<T> => {
		const perf = startPerfTime(name ?? func.name)

		let result: ReturnType<T>
		try {
			result = func(...args)

			if (isPromise(result)) {
				//@ts-ignore Type system too stupid again.
				return (async () => {
					try {
						return await result
					} finally {
						perf.stop(logger)
					}
				})()
			} else {
				perf.stop(logger)
				return result
			}
		} catch (err) {
			perf.stop(logger)
			throw err
		}
	}
}

const AdvanceSchema = declareSchema({
	type: Object,
	properties: {
		advance: { type: Duration, required: true },
	},
})
type AdvanceSchema = typeof AdvanceSchema

interface TriggerScheduleConfig<
	ConfigSchema extends AdvanceSchema,
	ContextData extends AdvanceSchema,
	InvokeContextData extends Schema
> {
	name?: string
	trigger: TriggerFunc<ConfigSchema, ContextData, InvokeContextData>
	timer: ReactiveRef<Timer>
	/***
	 * Returns the trigger context, except for "advance"
	 */
	getContext(): Omit<SchemaType<ContextData>, "advance">
	validationQuery?(): Promise<boolean>
	validationAdvance?: number
}

interface TriggerScheduler {
	reschedule(): any
}

//Used to schedule a trigger in advance of a timer ending, this is useful for
// the ad schedule trigger or the raid out timer trigger
export function createTriggerScheduler<
	ConfigSchema extends AdvanceSchema,
	ContextData extends AdvanceSchema,
	InvokeContextData extends Schema
>(config: TriggerScheduleConfig<ConfigSchema, ContextData, InvokeContextData>): TriggerScheduler {
	interface ScheduledTrigger {
		advance: Duration
		timeout?: NodeJS.Timeout | undefined
	}
	const logger = usePluginLogger()
	let scheduledTriggers = new Array<ScheduledTrigger>()
	let validationTimeout: NodeJS.Timeout | undefined = undefined

	onProfilesChanged((activeProfiles, inactiveProfiles) => {
		let newTriggers: ScheduledTrigger[] = []

		for (const prof of activeProfiles) {
			for (const trigger of prof.iterTriggers(config.trigger)) {
				if (newTriggers.find((st) => st.advance == trigger.config.advance)) {
					continue
				}

				newTriggers.push({
					advance: trigger.config.advance,
				})
			}
		}

		scheduleTriggers(newTriggers)
	})

	runOnChange(
		() => config.timer.value,
		() => {
			scheduleTriggers(scheduledTriggers)
		}
	)

	let soonestAdvance = -1
	function scheduleValidationQuery(advance: Duration) {
		if (advance <= 0 || !isTimerStarted(config.timer.value) || !config.validationQuery) return

		//Issue a schedule validation check 1s before the next trigger
		const validationAdvance = advance + (config.validationAdvance ?? 5)
		if (validationAdvance <= 0) return

		const validationQueryTime = new Date(config.timer.value.endTime - validationAdvance * 1000)

		logger.log(`Scheduling ${config.name} Validation Query`, advance, validationQueryTime.toLocaleString())

		if (validationTimeout) {
			clearTimeout(validationTimeout)
		}

		validationTimeout = Timer.scheduleFunc(
			config.timer.value,
			async () => {
				if (!config.validationQuery) return

				try {
					if (await config.validationQuery()) {
						//Reschedule the existing triggers
						scheduleTriggers(scheduledTriggers)
					}
				} catch (err) {}
			},
			validationAdvance
		)

		if (!validationTimeout) {
			logger.error("Unable to schedule validation", config.timer.value)
		}
	}

	function scheduleTriggers(newTriggers: ScheduledTrigger[]) {
		for (const st of scheduledTriggers) {
			if (st.timeout) {
				clearTimeout(st.timeout)
				st.timeout = undefined
			}
		}

		scheduledTriggers = newTriggers
		scheduledTriggers.sort((a, b) => {
			return b.advance - a.advance
		})

		//validation
		if (!isTimerStarted(config.timer.value)) {
			return
		}

		const timeRemaining = getTimeRemaining(config.timer.value)
		for (let i = 0; i < scheduledTriggers.length; ++i) {
			const st = scheduledTriggers[i]

			const triggerTime = timeRemaining - st.advance
			if (triggerTime <= 0) {
				//This trigger already happened
				logger.log(`Skipping ${config.name} Trigger - Already Happened`, st.advance)
				continue
			}

			const triggerDate = new Date(Date.now() + triggerTime * 1000)
			soonestAdvance = Math.max(st.advance, soonestAdvance)

			const nextAdvance = scheduledTriggers[i + 1]?.advance ?? 0

			st.timeout = Timer.scheduleFunc(
				config.timer.value,
				() => {
					logger.log(`Attempting ${config.name} Trigger`, st.advance, triggerDate.toLocaleString())
					config.trigger({
						...config.getContext(),
						advance: st.advance as Duration,
					} as SchemaType<ContextData>)

					//Schedule next validation query
					scheduleValidationQuery(nextAdvance)
				},
				st.advance
			)

			if (!st.timeout) {
				logger.error(`Failed to Schedule ${config.name} Trigger`, st.advance, config.timer.value)
			}
		}

		scheduleValidationQuery(soonestAdvance)
	}

	return {
		reschedule() {
			scheduleTriggers(scheduledTriggers)
		},
	}
}
