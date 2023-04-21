export interface LightColor {
	hue?: number
	sat?: number
	bri?: number
}

type LightColorConstructor = { new (...args: any[]): any }
const LightColor: LightColorConstructor = class {
	constructor() {
		throw new Error("Uh oh, LightColor's aren't real classes")
	}
}

interface SchemaLightColor {
	type: LightColorConstructor
	template: Boolean
}

declare module "./schema" {
	interface SchemaTypeMap {
		LightColor: [SchemaLightColor, LightColor]
	}
}
