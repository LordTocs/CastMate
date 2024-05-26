//We have to implement our own reactivity separate from vue because vue's reactivity is not async compatible.
// In CastMate our templates are async and thus we must be able to asynchronously gather depdendencies

import { AsyncLocalStorage } from "node:async_hooks"
import { isArray, isObject, isString, isSymbol } from "../util/type-helpers"
import { isResource } from "../resources/resource"
import { usePluginLogger } from "../logging/logging"

import util from "util"

const activeEffectStorage = new AsyncLocalStorage<ReactiveEffect>()

const logger = usePluginLogger("reactivity")

function getActiveEffect() {
	return activeEffectStorage.getStore()
}

export function ignoreReactivity(func: () => any) {
	activeEffectStorage.exit(func)
}

function reactiveLog(...values: any[]) {
	//logger.log(...values)
}

class ReactiveDependency {
	effects: Set<ReactiveEffect> = new Set()

	constructor(public debugName?: string) {}

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

	get name() {
		return this.debugName
	}
}

const REACTIVE_ITERATE = Symbol()

export namespace DependencyStorage {
	type ObjectDependencyMap = Map<PropertyKey, ReactiveDependency>
	const dependencyMap = new WeakMap<object, ObjectDependencyMap>()

	interface AliasedDependency {
		[key: string | number | symbol]: { target: object; key: string | number | symbol }
	}
	const aliasMap = new WeakMap<object, AliasedDependency>()

	export function getAlias(target: object, key: string | number | symbol) {
		const alias = aliasMap.get(target)
		if (!alias) return undefined
		return alias[key]
	}

	export function setAlias(
		target: object,
		targetKey: string | number | symbol,
		source: object,
		sourceKey: string | number | symbol
	) {
		let alias: AliasedDependency | undefined = aliasMap.get(target)
		if (!alias) {
			alias = {}
			aliasMap.set(target, alias)
		}

		alias[targetKey] = { target: source, key: sourceKey }
	}

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
			dependency = new ReactiveDependency(String(propKey))
			objMap?.set(propKey, dependency)
		}
		return dependency
	}

	export function getIterDependency(obj: any) {
		let objMap = getObjectDependencies(obj)

		let dependency = objMap?.get(REACTIVE_ITERATE)
		if (dependency == null) {
			dependency = new ReactiveDependency("REACTIVE_ITERATE")
			objMap?.set(REACTIVE_ITERATE, dependency)
		}
		return dependency
	}

	export function removePropDependency(obj: any, propKey: PropertyKey) {
		const objMap = getObjectDependencies(obj, false)
		if (!objMap) return false

		return objMap.delete(propKey)
	}
}

interface PendingTrigger {
	timestamp: number
	timeoutTrigger: NodeJS.Timeout
}

export class ReactiveEffect<T = any> {
	private dependencies = new Set<ReactiveDependency>()
	private pendingRun = false
	public debug = false
	public debugName: string | undefined = undefined
	public futureTrigger?: PendingTrigger

	constructor(private func: () => T, private scheduler?: () => any) {}

	added(dep: ReactiveDependency) {
		if (this.debug && !this.dependencies.has(dep)) {
			logger.log("Added Dep", dep.debugName, "to", this.debugName)
		}
		this.dependencies.add(dep)
	}

	dispose() {
		for (const dep of this.dependencies) {
			dep.removeEffect(this)
		}

		this.removeFutureTrigger()
	}

	async run() {
		if (this.debug) logger.log("Running Effect", this.debugName)
		await activeEffectStorage.run(this, this.func)
		if (this.debug) logger.log("Finished Effect", this.debugName)
	}

	trigger() {
		if (this.debug) {
			logger.log("Reactive Triggered", this.debugName)
		}

		if (this.pendingRun) return

		this.pendingRun = true
		process.nextTick(async () => {
			if (this.debug) {
				logger.log("Reactive Run", this.debugName)
			}
			try {
				if (this.scheduler) {
					await this.scheduler()
				} else {
					await this.run()
				}
			} catch (err) {
			} finally {
				this.pendingRun = false
			}
		})
	}

	debugDump() {
		for (const dep of this.dependencies) {
			logger.log("Dep: ", dep.name)
		}
	}

	private removeFutureTrigger() {
		if (!this.futureTrigger) return

		clearTimeout(this.futureTrigger.timeoutTrigger)

		this.futureTrigger = undefined
	}

	scheduleTrigger(timestamp: number) {
		if (this.futureTrigger) {
			//If our future trigger is sooner, don't bother scheduling a new trigger
			if (this.futureTrigger.timestamp < timestamp) return

			this.removeFutureTrigger()
		}

		const remainingMs = timestamp - Date.now()
		if (remainingMs < 0) return

		this.futureTrigger = {
			timestamp,
			timeoutTrigger: setTimeout(() => {
				this.futureTrigger = undefined
				this.trigger()
			}, remainingMs),
		}
	}
}

export function scheduleReactiveTrigger(timestamp: number) {
	const activeEffect = activeEffectStorage.getStore()
	if (activeEffect) {
		activeEffect.scheduleTrigger(timestamp)
	}
}

export const ReactiveSymbol = Symbol()

const ignoreSymbols = new Set<Symbol>([
	Symbol.asyncDispose,
	Symbol.asyncIterator,
	Symbol.dispose,
	Symbol.hasInstance,
	Symbol.isConcatSpreadable,
	Symbol.iterator,
	Symbol.replace,
	Symbol.search,
	Symbol.species,
	Symbol.split,
	Symbol.toPrimitive,
	Symbol.toStringTag,
	Symbol.unscopables,
	ReactiveSymbol,
])
export enum ReactivityProps {
	RAW = "__c_raw",
}

const ignoreProps = new Set<string>([ReactivityProps.RAW, "constructor"])

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

class ReactiveProxy<T extends object> implements ProxyHandler<T> {
	get(target: T, propKey: PropertyKey, receiver: any) {
		if (propKey === ReactivityProps.RAW) {
			return target
		}
		if (propKey == ReactiveSymbol) {
			return true
		}

		const alias = DependencyStorage.getAlias(target, propKey)

		if (alias) {
			target = alias.target as T
			propKey = alias.key
		}

		let result = Reflect.get(target, propKey, receiver) as T

		return ReactiveGet(result, target, propKey)
	}
	set(target: T, propKey: PropertyKey, newValue: any, receiver: any) {
		const alias = DependencyStorage.getAlias(target, propKey)

		if (alias) {
			target = alias.target as T
			propKey = alias.key
		}

		const hasProp = propKey in target

		Reflect.set(target, propKey, newValue, receiver)

		ReactiveSet(target, propKey)

		if (!hasProp) {
			ReactiveAdd(target)
		}

		return true
	}

	has(target: T, propKey: PropertyKey) {
		if (propKey == ReactiveSymbol) {
			return true
		}

		const alias = DependencyStorage.getAlias(target, propKey)

		if (alias) {
			target = alias.target as T
			propKey = alias.key
		}

		if (shouldTrack(target, propKey)) {
			DependencyStorage.getPropDependency(target, propKey).track()
		}

		return Reflect.has(target, propKey)
	}

	deleteProperty(target: T, propKey: PropertyKey) {
		const alias = DependencyStorage.getAlias(target, propKey)

		if (!alias) {
			DependencyStorage.removePropDependency(target, propKey)
		}

		Reflect.deleteProperty(target, propKey)

		ReactiveDelete(target)
		return true
	}

	ownKeys(target: T): ArrayLike<string | symbol> {
		DependencyStorage.getIterDependency(target).track()

		return Reflect.ownKeys(target)
	}
}

const proxyMap = new WeakMap<object, any>()

interface Target {
	[ReactivityProps.RAW]: any
}

export function reactify<T extends object>(obj: T) {
	if (ReactiveSymbol in obj) {
		return obj
	}

	const existing = proxyMap.get(obj)
	if (existing != null) return existing as T

	//TODO: async race here
	try {
		return new Proxy(obj, new ReactiveProxy<T>())
	} catch (err) {
		logger.error(err)
		logger.error(`Invalid Proxy`, obj)
		throw err
	}
}

export function rawify<T extends object>(obj: T) {
	const raw = obj && (obj as Target)[ReactivityProps.RAW]
	return raw ?? obj
}

export async function autoRerun(func: () => any, debugName?: string) {
	const effect = new ReactiveEffect(func)
	if (debugName) {
		effect.debug = true
		effect.debugName = debugName
	}
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
	__cached: T
}

export function reactiveComputed<T>(func: () => T): ReactiveComputed<T> {
	const result: ReactiveComputedImpl<T> = {
		__cached: undefined as unknown as T,
		//TODO: Does "this" work like this?
		__effect: new ReactiveEffect<T>(() => {
			result.__cached = func()
			ReactiveSet(result, "value")
			return result.__cached
		}),
		get value(): T {
			return ReactiveGet(result.__cached, result, "value")
		},
	}

	result.__effect.run()

	return result
}

export function ReactiveGet<T extends any>(getValue: T, self: any, prop: PropertyKey) {
	if (shouldTrack(self, prop)) {
		DependencyStorage.getPropDependency(self, prop).track()
	}

	if (isObject(getValue) && !isResource(getValue)) {
		getValue = reactify(getValue)
	}

	return getValue
}

export function ReactiveSet(self: any, prop: PropertyKey) {
	if (shouldTrack(self, prop)) {
		reactiveLog("Reactive Set", self, prop)
		DependencyStorage.getPropDependency(self, prop).notify()
	}
}

export function ReactiveIter(self: any) {
	DependencyStorage.getIterDependency(self).track()
}

export function ReactiveAdd(self: any) {
	DependencyStorage.getIterDependency(self).notify()
}

export function ReactiveDelete(self: any) {
	DependencyStorage.getIterDependency(self).notify()
}

export function aliasReactiveValue(
	source: Record<string | number | symbol, any>,
	sourceKey: string | number | symbol,
	destination: Record<string | number | symbol, any>,
	destinationKey: string | number | symbol
) {
	Object.defineProperty(destination, destinationKey, {
		enumerable: true,
		configurable: true,
		value: undefined,
		writable: false,
	})
	DependencyStorage.setAlias(destination, destinationKey, source, sourceKey)
}

export function reactiveAliasCopy(source: Record<string | number | symbol, any>, destination: object) {
	for (const key in Object.keys(source)) {
		aliasReactiveValue(source, key, destination, key)
	}
}

export function Reactive<This extends object, T>(
	accessor: ClassAccessorDecoratorTarget<This, T>,
	context: ClassAccessorDecoratorContext<This, T>
): ClassAccessorDecoratorResult<This, T> {
	return {
		get() {
			logger.log("----------------------------------------------------------")
			logger.log("Accessor", accessor)
			logger.log("Context", context)
			logger.log("Reactive Get On", Object.getOwnPropertyNames(this))
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
			logger.log("----------------------------------------------------------")
			logger.log("Accessor", accessor)
			logger.log("Context", context)
			logger.log("Reactive Set On", Object.getOwnPropertyNames(this))
			const result = accessor.set.call(this, newValue)

			if (shouldTrack(this, context.name)) {
				DependencyStorage.getPropDependency(this, context.name).notify()
			}

			return result
		},
	}
}
