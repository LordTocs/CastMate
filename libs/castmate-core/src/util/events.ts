export class EventList<TFunc extends (...args: any[]) => any = () => any> {
	private list: TFunc[] = []

	register(func: TFunc) {
		this.list.push(func)
	}

	unregister(func: TFunc) {
		const idx = this.list.findIndex((li) => li === func)
		if (idx > 0) {
			this.list.splice(idx, 1)
		}
	}

	async run(...args: Parameters<TFunc>) {
		//const promises = this.list.map((f) => f(...args))
		//await Promise.all(promises)
		for (const f of this.list) {
			await f(...args)
		}
	}
}
