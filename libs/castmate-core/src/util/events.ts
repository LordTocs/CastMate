export class EventList {
	private list: (() => Promise<void> | void)[] = []

	register(func: () => Promise<void> | void) {
		this.list.push(func)
	}

	unregister(func: () => Promise<void> | void) {
		const idx = this.list.findIndex((li) => li === func)
		if (idx > 0) {
			this.list.splice(idx, 1)
		}
	}

	async run() {
		const promises = this.list.map((f) => f())
		await Promise.all(promises)
	}
}
