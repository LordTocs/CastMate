import { MaybePromise } from "castmate-schema"
import { ConstructedType } from "./type-helpers"
import assert from "node:assert"

export function Service<ConstructorType extends new (...args: any[]) => any>(constructor: ConstructorType) {
	return class Service extends constructor {
		private static _instance: InstanceType<ConstructorType>

		static initialize(...args: ConstructorParameters<ConstructorType>): InstanceType<ConstructorType> {
			if (this._instance) {
				throw new Error("Service already inited")
			}

			this._instance = new constructor(...args)
			return this._instance
		}

		static getInstance(): InstanceType<ConstructorType> {
			return this._instance
		}
	}
}

interface DefaultServiceConstructor<TService> {
	new (): TService
}

export function DefaultService<ConstructorType extends DefaultServiceConstructor>(constructor: ConstructorType) {
	//@ts-ignore - This is a typescript compiler bug, you can actually restrict constructor types on mixins and is a basic feature of a language. This kind of oversight from the language team is growing old.
	return class DefaultService extends constructor {
		private static _instance: InstanceType<ConstructorType>

		constructor() {
			super()
		}

		static getInstance(): InstanceType<ConstructorType> {
			if (!this._instance) {
				this._instance = new constructor()
			}
			return this._instance
		}
	}
}

//Insane system to get around mixin problems with singletons
export class ServiceProvider {
	private static services = new Map<ServiceConstructor<any>, any>()

	static getService<TService extends ServiceConstructor<any>>(serviceConstructor: TService) {
		if (this.services.has(serviceConstructor)) {
			return this.services.get(serviceConstructor) as ReturnType<ConstructedType<TService>>
		}
		if (!("initialize" in serviceConstructor)) {
			const result = new serviceConstructor()
			this.services.set(serviceConstructor, result)
			return result
		}
		throw new Error(`Service ${serviceConstructor.name} is uninitialized`)
	}

	static async initializeService<TService extends InitializableServiceConstructor<any>>(
		serviceConstructor: TService,
		...args: Parameters<TService["initialize"]>
	) {
		assert(!this.services.has(serviceConstructor))
		const result = await serviceConstructor.initialize(...args)
		this.services.set(serviceConstructor, result)
	}

	private constructor() {
		assert(false, "How'd you get here?")
	}
}

interface InitializableServiceConstructor<TService> {
	new (...args: any[]): TService
	initialize(...args: any[]): MaybePromise<TService>
}

type ServiceConstructor<TService = any> =
	| DefaultServiceConstructor<TService>
	| InitializableServiceConstructor<TService>

export function getService<TService extends ServiceConstructor<any>>(serviceConstructor: TService) {
	return ServiceProvider.getService(serviceConstructor)
}

class TestService {
	private constructor() {}

	static async initialize(hello: string): Promise<TestService> {
		return new TestService()
	}
}

///
