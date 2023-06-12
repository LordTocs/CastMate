export class EventList {
	private list: (() => Promise<void> | void)[] = []

	register(func: () => Promise<void> | void) {
		this.list.push(func)
	}

	async run() {
		const promises = this.list.map((f) => f())
		await Promise.all(promises)
	}
}
