import { Defaultable, SchemaBaseOptions, Schema, S, defineSchemaType, getDefault } from "../schema/schema-base"
import { SchemaType } from "../schema/schema-typing"

export type FilePath = string

export interface SchemaFilePathOptions extends SchemaBaseOptions {
	extensions?: string[]
}

export interface SchemaFilePath extends Schema, SchemaFilePathOptions, Defaultable<FilePath> {
	type: "FilePath"
}

declare module "../schema/schema-base" {
	namespace S {
		function FilePath(options?: SchemaFilePathOptions): SchemaFilePath
	}

	interface SchemaTypeMap {
		FilePath: SchemaMapping<SchemaFilePath, FilePath>
	}
}

defineSchemaType<SchemaFilePath>({
	type: "FilePath",
	name: "File Path",
	color: "#000000",
	icon: "mdi mdi-file",
	traits: {
		canBeVariable: true,
	},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? "") as SchemaType<typeof schema>
	},
})
