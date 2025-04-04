export class EventList<TFunc extends (...args: any[]) => any = () => any> {
	private list: TFunc[] = []

	get handlerCount() {
		return this.list.length
	}

	register(func: TFunc) {
		this.list.push(func)
	}

	unregister(func: TFunc) {
		const idx = this.list.findIndex((li) => li == func)
		if (idx >= 0) {
			this.list.splice(idx, 1)
			return true
		} else {
			return false
		}
	}

	async run(...args: Parameters<TFunc>) {
		for (const f of this.list) {
			try {
				await f(...args)
			} catch (err) {
				console.error("ERROR w EVENT LIST:", err)
			}
		}
	}
}
