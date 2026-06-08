import { Defaultable, SchemaBaseOptions, Schema, S, defineSchemaType, getDefault } from "../schema/schema-base"
import { SchemaType } from "../schema/schema-typing"

export type Directory = string

export type DirectoryFactory = { factoryCreate(): Directory }
export const Directory: DirectoryFactory = {
	factoryCreate() {
		return undefined as unknown as Directory
	},
}

export interface SchemaDirectoryOptions extends SchemaBaseOptions, Defaultable<Directory> {}

export interface SchemaDirectory extends Schema, SchemaDirectoryOptions {
	type: "Directory"
}

declare module "../schema/schema-base" {
	namespace S {
		function Directory(options?: SchemaDirectoryOptions): SchemaDirectory
	}

	interface SchemaTypeMap {
		Directory: SchemaMapping<SchemaDirectory, Directory>
	}
}

S.Directory = (options) => {
	return {
		type: "Directory",
		...options,
	}
}

defineSchemaType<SchemaDirectory>({
	type: "Directory",
	name: "Directory",
	color: "#000000",
	icon: "mdi mdi-star",
	traits: {
		canBeVariable: true,
	},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? "") as SchemaType<typeof schema>
	},
})
