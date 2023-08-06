import { registerType } from "../schema"

export type Toggle = boolean | "toggle"
type ToggleConstructor = { new (...args: any[]): any }
export const Toggle: ToggleConstructor = class {
	constructor() {
		return false as Toggle
	}
}

export interface SchemaToggle {
	type: ToggleConstructor
	template?: boolean
	trueIcon?: string
	falseIcon?: string
	toggleIcon?: string
}

declare module "../schema" {
	interface SchemaTypeMap {
		Toggle: [SchemaToggle, Toggle]
	}
}

registerType("Toggle", {
	constructor: Toggle,
})
