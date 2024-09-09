import { SchemaBase, registerType } from "../schema"

export type Toggle = boolean | "toggle"

type ToggleFactory = { factoryCreate(): Toggle }
export const Toggle: ToggleFactory = {
	factoryCreate() {
		return false
	},
}

export interface SchemaToggle extends SchemaBase<Toggle> {
	type: ToggleFactory
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
	canBeVariable: true,
})
