export class AsyncCache {
	constructor(updater, cacheTime = 15) {
		this.updater = updater
		this.lastCacheTime = null
		this.cacheTime = cacheTime
		this.data = null
		this._fetchPromise = null
	}

	async _fetch() {
		if (this._fetchPromise) {
			await this._fetchPromise
		} else {
			this._fetchPromise = this.updater().then((data) => {
				this.data = data
				this.lastCacheTime = Date.now()
			})
			await this._fetchPromise
			this._fetchPromise = null
		}
	}

	get isOutOfDate() {
		return (
			!this.data ||
			Date.now() - this.lastCacheTime > this.cacheTime * 1000
		)
	}

	async get() {
		if (this.isOutOfDate) {
			await this._fetch()
		}
		return this.data
	}
}
