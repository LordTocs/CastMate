//We have to implement our own reactivity separate from vue because vue's reactivity is not async compatible.
// In CastMate our templates are async and thus we must be able to asynchronously gather depdendencies

import { AsyncLocalStorage } from "node:async_hooks"
import { isArray, isObject, isSymbol } from "../util/type-helpers"

const activeEffectStorage = new AsyncLocalStorage<ReactiveEffect>()

function getActiveEffect() {
	return activeEffectStorage.getStore()
}

class ReactiveDependency {
	effects: Set<ReactiveEffect> = new Set()
	pendingNotify: boolean = false

	addEffect(effect: ReactiveEffect) {
		this.effects.add(effect)
	}

	removeEffect(effect: ReactiveEffect) {
		this.effects.delete(effect)
	}

	notify() {
		if (!this.pendingNotify) {
			//Data Race here, needs sync
			this.pendingNotify = true
			process.nextTick(async () => {
				const promises = [...this.effects.values()].map((effect) =>
					effect.run().catch((reason) => console.error(reason))
				)
				await Promise.all(promises)
				this.pendingNotify = false
			})
		}
	}

	track() {
		const effect = getActiveEffect()
		if (effect) {
			this.addEffect(effect)
		}
	}
}

export namespace DependencyStorage {
	type ObjectDependencyMap = Map<PropertyKey, ReactiveDependency>
	const dependencyMap = new WeakMap<object, ObjectDependencyMap>()

	export function getObjectDependencies(obj: any, create = true) {
		let objMap = dependencyMap.get(obj)
		if (objMap == null && create) {
			objMap = new Map()
			dependencyMap.set(obj, objMap)
		}
		return objMap
	}

	export function getPropDependency(obj: any, propKey: PropertyKey) {
		let objMap = getObjectDependencies(obj)

		let dependency = objMap?.get(propKey)
		if (dependency == null) {
			dependency = new ReactiveDependency()
			objMap?.set(propKey, dependency)
		}
		return dependency
	}

	export function removePropDependency(obj: any, propKey: PropertyKey) {
		const objMap = getObjectDependencies(obj, false)
		if (!objMap) return false

		return objMap.delete(propKey)
	}
}

export class ReactiveEffect<T = any> {
	constructor(public func: () => T) {}

	async run() {
		await activeEffectStorage.run(this, this.func)
	}
}

const ignoreSymbols = new Set(Object.getOwnPropertySymbols(Symbol))

function shouldTrack(target: object, propKey: PropertyKey) {
	if (isSymbol(propKey)) {
		if (ignoreSymbols.has(propKey as symbol)) {
			return false
		}
	}
	return true
}

class ReactiveProxy<T extends object> {
	get(target: T, propKey: PropertyKey, receiver: any) {
		let result = Reflect.get(target, propKey, receiver) as T

		if (shouldTrack(target, propKey)) {
			DependencyStorage.getPropDependency(target, propKey).track()
		}

		if (isObject(result)) {
			result = reactify(result)
		}

		return result
	}
	set(target: T, propKey: PropertyKey, newValue: any, receiver: any) {
		Reflect.set(target, propKey, newValue, receiver)

		if (shouldTrack(target, propKey)) {
			DependencyStorage.getPropDependency(target, propKey).notify()
		}

		return true
	}

	has(target: T, propKey: PropertyKey) {
		if (shouldTrack(target, propKey)) {
			DependencyStorage.getPropDependency(target, propKey).track()
		}
		return Reflect.has(target, propKey)
	}

	deleteProperty(target: T, propKey: PropertyKey) {
		DependencyStorage.removePropDependency(target, propKey)
		Reflect.deleteProperty(target, propKey)
		return true
	}
}

const proxyMap = new WeakMap<object, any>()

export function reactify<T extends object>(obj: T) {
	const existing = proxyMap.get(obj)
	if (existing != null) return existing as T

	//TODO: async race here
	return new Proxy(obj, new ReactiveProxy<T>())
}

export async function autoRerun(func: () => any) {
	const effect = new ReactiveEffect(func)
	await effect.run()
	return effect
}

export interface ReactiveRef<T> {
	value: T
}

export function reactiveRef<T>(initialValue: T): ReactiveRef<T> {
	return reactify<ReactiveRef<T>>({
		value: initialValue,
	})
}

export interface ReactiveComputed<T> {
	readonly value: T
}

interface ReactiveComputedImpl<T> extends ReactiveComputed<T> {
	__effect: ReactiveEffect<T>
}

export function reactiveComputed<T>(func: () => T): ReactiveComputed<T> {
	const result: ReactiveComputedImpl<T> = {
		//TODO: Does "this" work like this?
		__effect: new ReactiveEffect<T>(() => {
			this.cached = func()
			return this.cached
		}),
		get value(): T {
			DependencyStorage.getPropDependency(this, "value").track()

			if (isObject(this.cached)) {
				this.cached = reactify(this.cached)
			}

			return this.cached
		},
	}

	return result
}

export function ReactiveGet<T extends any>(getValue: T, self: any, prop: string | symbol | number) {
	if (shouldTrack(self, prop)) {
		DependencyStorage.getPropDependency(self, prop).track()
	}

	if (isObject(getValue)) {
		getValue = reactify(getValue)
	}

	return getValue
}

export function ReactiveSet(self: any, prop: string | symbol | number) {
	if (shouldTrack(self, prop)) {
		DependencyStorage.getPropDependency(self, prop).notify()
	}
}

export function Reactive<This extends object, T>(
	accessor: ClassAccessorDecoratorTarget<This, T>,
	context: ClassAccessorDecoratorContext<This, T>
): ClassAccessorDecoratorResult<This, T> {
	return {
		get() {
			console.log("----------------------------------------------------------")
			console.log("Accessor", accessor)
			console.log("Context", context)
			console.log("Reactive Get On", Object.getOwnPropertyNames(this))
			let result = accessor.get.call(this)

			if (shouldTrack(this, context.name)) {
				DependencyStorage.getPropDependency(this, context.name).track()
			}

			if (isObject(result)) {
				result = reactify(result)
			}

			return result
		},
		set(newValue: T) {
			console.log("----------------------------------------------------------")
			console.log("Accessor", accessor)
			console.log("Context", context)
			console.log("Reactive Set On", Object.getOwnPropertyNames(this))
			const result = accessor.set.call(this, newValue)

			if (shouldTrack(this, context.name)) {
				DependencyStorage.getPropDependency(this, context.name).notify()
			}

			return result
		},
	}
}
