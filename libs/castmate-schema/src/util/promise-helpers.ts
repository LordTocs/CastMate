export interface DelayedResolver<T> {
	resolve: (result: T | PromiseLike<T>) => any
	reject: (reason?: any) => any
	promise: Promise<T>
}

export function createDelayedResolver<T = void>() {
	const store: Record<string, any> = {}

	store.promise = new Promise<T>((resolve, reject) => {
		store.resolve = resolve
		store.reject = reject
	})

	return store as DelayedResolver<T>
}

export async function filterPromiseAll<T>(promises: Promise<T>[]): Promise<T[]> {
	return (await Promise.allSettled(promises))
		.filter((p): p is PromiseFulfilledResult<Awaited<T>> => p.status == "fulfilled")
		.map((p) => p.value)
}
