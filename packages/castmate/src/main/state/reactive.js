//https://medium.com/vue-mastery/the-best-explanation-of-javascript-reactivity-fea6112dd80d
import { AsyncLocalStorage } from "node:async_hooks"
import logger from "../utils/logger"

const dependencyAsyncStorage = new AsyncLocalStorage()

function debugReactivity(str) {
	//console.log(str)
}

class Dependency {
	constructor() {
		this.subscribers = []
	}

	addSubscriber(watcher) {
		if (this.subscribers.includes(watcher)) {
			return
		}

		this.subscribers.push(watcher)
		watcher.dependencies.push(this)
	}

	removeSubscriber(watcher) {
		let idx = this.subscribers.findIndex((w) => w == watcher)

		if (idx != -1) {
			this.subscribers.splice(idx, 1)
		}
	}

	notify(debugKey) {
		for (let subscriber of this.subscribers) {
			subscriber.update(debugKey)
		}
	}

	depend(debugKey) {
		//Pull the watcher out of the sync store.
		const watcher = dependencyAsyncStorage.getStore()
		if (watcher) {
			debugReactivity(`${watcher.debugName} depend on ${debugKey}`)
			this.addSubscriber(watcher)
		}
	}
}

export class Watcher {
	constructor(func, debugName) {
		this.debugName = debugName
		this.func = func
		this.dependencies = []
	}

	static async watchAsync(func, debugName) {
		const watcher = new Watcher(func, debugName)

		await dependencyAsyncStorage.run(watcher, async () => {
			debugReactivity("Watching", watcher.debugName)
			await func()
			debugReactivity("Finish Watching", watcher.debugName)
		})

		return watcher
	}

	static async watchAsyncWithScheduler(scheduler, func, debugName) {
		const watcher = new Watcher(func, debugName)

		await dependencyAsyncStorage.run(watcher, async () => {
			debugReactivity("Watching", watcher.debugName)
			await scheduler()
			debugReactivity("Finish Watching", watcher.debugName)
		})

		return watcher
	}

	async update(debugInciter) {
		debugReactivity(
			`Updating ${this.debugName ?? "Watcher"}! (${debugInciter})`
		)
		await this.func()
	}

	unsubscribe() {
		for (let dep of this.dependencies) {
			dep.removeSubscriber(this)
		}

		this.dependencies = []
	}
}
export function createReactiveProperty(obj, key) {
	let observable = {
		dependency: new Dependency(),
		internalValue: obj[key],
	}

	if (!obj.__reactivity__) {
		Object.defineProperty(obj, "__reactivity__", {
			enumerable: false,
			writable: true,
			value: {},
		})
	}

	obj.__reactivity__[key] = observable

	Object.defineProperty(obj, key, {
		get() {
			observable.dependency.depend(key)
			return observable.internalValue
		},
		set(value) {
			if (observable.internalValue !== value) {
				observable.internalValue = value
				observable.dependency.notify(key)
			}
		},
		configurable: true,
	})
}

export function deleteReactiveProperty(obj, key) {
	if (!obj.__reactivity__) return

	delete obj.__reactivity__[key]
	delete obj[key]
}

export function reactify(obj) {
	for (let key in obj) {
		createReactiveProperty(obj, key)
	}
	return obj
}

export function reactiveCopyProp(target, obj, key) {
	if (!target.__reactivity__) {
		Object.defineProperty(target, "__reactivity__", {
			enumerable: false,
			writable: true,
			value: {},
		})
	}

	if (!obj.__reactivity__) {
		logger.error("Attempted To reactive Copy from a non-reactive variable!")
		return false
	}

	let sourceReactivity = obj.__reactivity__[key]
	if (!sourceReactivity) {
		return false
	}
	//Share the reactivity info
	target.__reactivity__[key] = sourceReactivity

	if (key in target) {
		delete target[key]
	}

	Object.defineProperty(target, key, {
		enumerable: true,
		get: () => {
			target.__reactivity__[key].dependency.depend(key)
			return target.__reactivity__[key].internalValue
		},
		set: (value) => {
			if (target.__reactivity__[key].internalValue !== value) {
				target.__reactivity__[key].internalValue = value
				target.__reactivity__[key].dependency.notify(key)
			}
		},
		configurable: true,
	})
}

export function reactiveCopy(target, obj, onNewKey = null) {
	for (let key in obj) {
		if (key in target) continue

		reactiveCopyProp(target, obj, key)

		if (onNewKey) {
			onNewKey(key)
		}
	}
}

export function isReactive(obj) {
	if (!obj) return false
	return !!obj.__reactivity__
}

export function onStateChange(obj, name, func, options = { immediate: false }) {
	const watcher = new Watcher(func)

	obj.__reactivity__[name].dependency.addSubscriber(watcher)

	if (options.immediate) {
		watcher.update(name)
	}

	return watcher
}

export function onAllStateChange(obj, func, options) {
	if (!isReactive(obj)) {
		return []
	}

	const result = []
	for (let key in obj) {
		result.push(
			onStateChange(
				obj,
				key,
				() => {
					func(key)
				},
				options
			)
		)
	}
	return result
}
