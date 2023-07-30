export function Service<ConstructorType extends new (...args: any[]) => any>(constructor: ConstructorType) {
	return class Service extends constructor {
		private static _instance: InstanceType<ConstructorType>

		static initialize(): InstanceType<ConstructorType> {
			console.log("Initializing Service", constructor.name)
			if (this._instance) {
				throw new Error("Service already inited")
			}

			this._instance = new constructor()
			return this._instance
		}

		static getInstance(): InstanceType<ConstructorType> {
			return this._instance
		}
	}
}

///
