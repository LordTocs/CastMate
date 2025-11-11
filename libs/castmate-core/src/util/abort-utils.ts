//https://www.bennadel.com/blog/4195-using-abortcontroller-to-debounce-settimeout-calls-in-javascript.htm
export function setAbortableTimeout(callback: () => void, ms: number, signal: AbortSignal, aborted?: () => void) {
	signal?.addEventListener("abort", handleAbort, { once: true })

	const timeout = setTimeout(internalCallback, ms)

	function internalCallback() {
		signal?.removeEventListener("abort", handleAbort)
		callback()
	}

	function handleAbort() {
		clearTimeout(timeout)
		aborted?.()
	}
}

export function abortableSleep(ms: number, signal: AbortSignal, aborted?: () => any) {
	return new Promise<void>((resolve, reject) => {
		setAbortableTimeout(
			() => resolve(undefined),
			ms,
			signal,
			async () => {
				try {
					await aborted?.()
				} finally {
					resolve(undefined)
				}
			}
		)
	})
}

export function sleep(ms: number) {
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => resolve(undefined), ms)
	})
}

export function timeout(ms: number, err?: string) {
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => reject(new Error(err ?? "Timed Out")), ms)
	})
}

//Aborting doesn't automatically resolve or reject. Should this happen? Should this exist?
export function abortablePromise<T>(
	abortSignal: AbortSignal,
	executor: (
		resolve: (result: T) => any,
		reject: (error: any) => any,
		handleAbort: (handler: () => any) => any
	) => any
) {
	return new Promise<T>((resolve, reject) => {
		let abortHandler: (() => any) | undefined = undefined
		const abortFunc = (ev: Event) => {
			abortHandler?.()
		}
		abortSignal.addEventListener("abort", abortFunc, { once: true })

		executor(
			(result: T) => {
				abortSignal.removeEventListener("abort", abortFunc)
				resolve(result)
			},
			(err) => {
				abortSignal.removeEventListener("abort", abortFunc)
				reject(err)
			},
			(handler) => {
				abortHandler = handler
			}
		)
	})
}
