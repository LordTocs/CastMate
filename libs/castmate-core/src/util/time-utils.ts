import { isPromise } from "util/types"
import { Logger, usePluginLogger } from "../logging/logging"

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
