import { SchemaBase, registerType } from "../schema"

export interface LightColor {
	hue?: number
	sat?: number
	bri?: number
}

type LightColorConstructor = { new (): LightColor }
export const LightColor: LightColorConstructor = class {
	constructor() {
		return {
			hue: 0,
			sat: 0,
			bri: 0,
		}
	}
}

interface SchemaLightColor extends SchemaBase<LightColor> {
	type: LightColorConstructor
	template: boolean
}

declare module "../schema" {
	interface SchemaTypeMap {
		LightColor: [SchemaLightColor, LightColor]
	}
}

registerType("LightColor", {
	constructor: LightColor,
})
