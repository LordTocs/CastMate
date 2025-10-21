export class AsyncCache<T> {
	private lastCacheTime: number | undefined = undefined
	private data: T | undefined = undefined
	private fetchPromise: Promise<void> | undefined = undefined

	constructor(private updater: () => Promise<T>, private cacheTime = 15) {}

	private async fetch() {
		if (this.fetchPromise) {
			await this.fetchPromise
		} else {
			this.fetchPromise = this.updater().then((data) => {
				this.data = data
				this.lastCacheTime = Date.now()
			})
			await this.fetchPromise
			this.fetchPromise = undefined
		}
	}

	get isOutOfDate() {
		return !this.data || Date.now() - (this.lastCacheTime ?? 0) > this.cacheTime * 1000
	}

	async get() {
		if (this.isOutOfDate) {
			await this.fetch()
		}
		return this.data
	}
}

export class AsyncDictCache<T extends object, K extends keyof T> {
	private lastCacheTime: number | undefined = undefined
	private data: Map<T[K], T> = new Map()
	private fetchPromise: Promise<void> | undefined = undefined

	constructor(private updater: () => Promise<T[]>, private key: K, private cacheTime = 15) {}

	private async fetchInternal() {
		try {
			const result = await this.updater()
			this.data.clear()
			for (const obj of result) {
				this.data.set(obj[this.key], obj)
			}
			this.lastCacheTime = Date.now()
		} catch (err) {}
	}

	async fetch() {
		if (this.fetchPromise) await this.fetchPromise
		else {
			this.fetchPromise = this.fetchInternal()
			await this.fetchPromise
			this.fetchPromise = undefined
		}
	}

	get isOutOfDate() {
		return !this.data || Date.now() - (this.lastCacheTime ?? 0) > this.cacheTime * 1000
	}

	async get(key: T[K]) {
		if (this.isOutOfDate || !this.data.has(key)) {
			await this.fetch()
		}
		return this.data.get(key)
	}

	async values() {
		if (this.isOutOfDate) {
			await this.fetch()
		}
		return [...this.data.values()]
	}

	clear() {
		this.data.clear()
		this.lastCacheTime = undefined
	}
}
