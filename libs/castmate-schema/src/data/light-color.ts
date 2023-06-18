import { registerType } from "../schema"

export interface LightColor {
	hue?: number
	sat?: number
	bri?: number
}

type LightColorConstructor = { new (...args: any[]): LightColor }
export const LightColor: LightColorConstructor = class {
	constructor() {
		return {
			hue: 0,
			sat: 0,
			bri: 0,
		}
	}
}

interface SchemaLightColor {
	type: LightColorConstructor
	template: Boolean
}

declare module "../schema" {
	interface SchemaTypeMap {
		LightColor: [SchemaLightColor, LightColor]
	}
}

registerType("LightColor", {
	constructor: LightColor,
})
