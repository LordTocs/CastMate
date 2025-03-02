import { SchemaBase, SchemaType, declareSchema, registerType } from "castmate-schema"
import { TwitchCategory } from "./category"

export type TwitchStreamTags = string[]

const twitchStreamTagSymbol = Symbol()
type TwitchStreamTagsFactory = {
	factoryCreate(): TwitchStreamTags
	[twitchStreamTagSymbol]: "TwitchStreamTags"
}

export const TwitchStreamTags: TwitchStreamTagsFactory = {
	factoryCreate() {
		return []
	},
	[twitchStreamTagSymbol]: "TwitchStreamTags",
}

export interface SchemaTwitchStreamTags extends SchemaBase<TwitchStreamTags> {
	type: TwitchStreamTagsFactory
	template?: boolean
}

registerType("TwitchStreamTags", {
	constructor: TwitchStreamTags,
})

declare module "castmate-schema" {
	interface SchemaTypeMap {
		TwitchStreamTags: [SchemaTwitchStreamTags, TwitchStreamTags]
	}

	interface TemplateSchemaTypeMap {
		TwitchStreamTags: [SchemaTwitchStreamTags, TwitchStreamTags]
	}
}

export const StreamInfoSchema = declareSchema({
	type: Object,
	properties: {
		title: { type: String, name: "Title", maxLength: 140, template: true },
		category: { type: TwitchCategory, name: "Category" },
		tags: {
			type: TwitchStreamTags,
			name: "Tags",
			required: true,
			template: true,
		},
	},
})

export type StreamInfo = SchemaType<typeof StreamInfoSchema>
