export class AsyncCache<T> {
	private lastCacheTime: number | undefined = undefined
	private data: T | undefined = undefined
	private fetchPromise: Promise<void> | undefined = undefined

	constructor(private updater: () => Promise<T>, private cacheTime = 15) {}

	async _fetch() {
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
			await this._fetch()
		}
		return this.data
	}
}
