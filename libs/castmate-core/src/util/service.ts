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

///
