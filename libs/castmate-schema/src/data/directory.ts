import { SchemaBase, registerType } from "../schema"

export type Directory = string

export type DirectoryFactory = { factoryCreate(): Directory; directoryDiff(): void }
export const Directory: DirectoryFactory = {
	factoryCreate() {
		return undefined as unknown as Directory
	},
	directoryDiff() {},
}

export interface SchemaDirectory extends SchemaBase<Directory> {
	type: DirectoryFactory
	template?: boolean
	//max?
	//min?
}

declare module "../schema" {
	interface SchemaTypeMap {
		Directory: [SchemaDirectory, Directory]
	}
}

registerType("Directory", {
	constructor: Directory,
})
