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

export function abortableSleep(ms: number, signal: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		setAbortableTimeout(
			() => resolve(undefined),
			ms,
			signal,
			() => resolve(undefined)
		)
	})
}
