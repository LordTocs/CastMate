import { MaybePromise } from "castmate-schema"

export class RetryTimer {
	private retryTimeout: NodeJS.Timeout | null = null

	constructor(private connectFunc: () => any, private retryInterval = 15) {}

	private async tryInternal() {
		try {
			const result = await this.connectFunc()
			return result
		} catch (err) {
			return false
		}
	}

	private clearTimeout() {
		if (this.retryTimeout) {
			clearTimeout(this.retryTimeout)
			this.retryTimeout = null
		}
	}

	tryAgain() {
		if (this.retryTimeout != null) return

		this.retryTimeout = setTimeout(() => {
			this.retryTimeout = null
			this.tryInternal()
		}, this.retryInterval * 1000)
	}

	async tryNow() {
		this.clearTimeout()
		return await this.tryInternal()
	}
}
