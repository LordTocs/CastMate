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

export function DefaultService<ConstructorType extends new () => any>(constructor: ConstructorType) {
	//@ts-ignore - This is a typescript compiler bug, you can actually restrict constructor types on mixins and is a basic feature of a language. This kind of oversight from the language team is growing old.
	return class DefaultService extends constructor {
		private static _instance: InstanceType<ConstructorType>

		static getInstance(): InstanceType<ConstructorType> {
			if (!this._instance) {
				this._instance = new constructor()
			}
			return this._instance
		}
	}
}
///
