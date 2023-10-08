//We have to implement our own reactivity separate from vue because vue's reactivity is not async compatible.
// In CastMate our templates are async and thus we must be able to asynchronously gather depdendencies

import { AsyncLocalStorage } from "node:async_hooks"
import { isArray, isObject, isString, isSymbol } from "../util/type-helpers"

const activeEffectStorage = new AsyncLocalStorage<ReactiveEffect>()

function getActiveEffect() {
	return activeEffectStorage.getStore()
}

class ReactiveDependency {
	effects: Set<ReactiveEffect> = new Set()

	addEffect(effect: ReactiveEffect) {
		this.effects.add(effect)
	}

	removeEffect(effect: ReactiveEffect) {
		this.effects.delete(effect)
	}

	notify() {
		for (const effect of this.effects) {
			effect.trigger()
		}
	}

	track() {
		const effect = getActiveEffect()
		if (effect) {
			this.addEffect(effect)
			effect.added(this)
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
	private dependencies: ReactiveDependency[] = []
	private pendingRun = false
	constructor(private func: () => T, private scheduler?: () => any) {}

	added(dep: ReactiveDependency) {
		if (this.dependencies.includes(dep)) return
		this.dependencies.push(dep)
	}

	dispose() {
		for (const dep of this.dependencies) {
			dep.removeEffect(this)
		}
	}

	async run() {
		await activeEffectStorage.run(this, this.func)
	}

	trigger() {
		if (this.pendingRun) return
		this.pendingRun = true
		process.nextTick(async () => {
			try {
				if (this.scheduler) {
					this.scheduler()
				} else {
					await this.run()
				}
			} catch (err) {
			} finally {
				this.pendingRun = false
			}
		})
	}
}

const ignoreSymbols = new Set(Object.getOwnPropertySymbols(Symbol))
export enum ReactivityProps {
	RAW = "__c_raw",
}
const ignoreProps = new Set<string>([ReactivityProps.RAW])

function shouldTrack(target: object, propKey: PropertyKey) {
	if (isSymbol(propKey)) {
		if (ignoreSymbols.has(propKey)) {
			return false
		}
	}
	if (isString(propKey)) {
		if (ignoreProps.has(propKey)) {
			return false
		}
	}
	return true
}

class ReactiveProxy<T extends object> {
	get(target: T, propKey: PropertyKey, receiver: any) {
		if (propKey === ReactivityProps.RAW) {
			return target
		}

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

interface Target {
	[ReactivityProps.RAW]: any
}

export function reactify<T extends object>(obj: T) {
	const existing = proxyMap.get(obj)
	if (existing != null) return existing as T

	//TODO: async race here
	return new Proxy(obj, new ReactiveProxy<T>())
}

export function rawify<T extends object>(obj: T) {
	const raw = obj && (obj as Target)[ReactivityProps.RAW]
	return raw ?? obj
}

export async function autoRerun(func: () => any) {
	const effect = new ReactiveEffect(func)
	await effect.run()
	return effect
}

export async function runOnChange(watcher: () => any, func: () => any) {
	const effect = new ReactiveEffect(watcher, func)
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
	let cached: T

	const result: ReactiveComputedImpl<T> = {
		//TODO: Does "this" work like this?
		__effect: new ReactiveEffect<T>(() => {
			cached = func()
			return cached
		}),
		get value(): T {
			DependencyStorage.getPropDependency(this, "value").track()

			if (isObject(cached)) {
				cached = reactify(cached)
			}

			return cached
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
