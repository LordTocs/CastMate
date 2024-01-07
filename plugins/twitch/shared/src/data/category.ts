import { SchemaBase, registerType } from "castmate-schema"

export type TwitchCategoryUnresolved = string

export interface TwitchCategoryData {
	id: string
	name: string
	image: string
}

export interface TwitchCategory extends TwitchCategoryData {
	[Symbol.toPrimitive](hint: "default" | "string" | "number"): any
}

const twitchCategorySymbol = Symbol()
type TwitchCategoryFactory = {
	factoryCreate(): TwitchCategory
	[twitchCategorySymbol]: "TwitchCategory"
}

export const TwitchCategory: TwitchCategoryFactory = {
	factoryCreate() {
		return undefined as unknown as TwitchCategory
	},
	[twitchCategorySymbol]: "TwitchCategory",
}

export interface SchemaTwitchCategory extends SchemaBase<TwitchCategory> {}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		TwitchCategory: [SchemaTwitchCategory, TwitchCategory]
	}
}
