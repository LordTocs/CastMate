import { SchemaBase, registerType } from "../schema"

export type FilePath = string

const FilePathDataSymbol = Symbol()

export type FilePathFactory = { factoryCreate(): FilePath; [FilePathDataSymbol]: "FilePath" }
export const FilePath: FilePathFactory = {
	factoryCreate() {
		return undefined as unknown as FilePath
	},
	[FilePathDataSymbol]: "FilePath",
}

export interface SchemaFilePath extends SchemaBase<FilePath> {
	type: FilePathFactory
	extensions?: string[]
	template?: boolean
}

declare module "../schema" {
	interface SchemaTypeMap {
		FilePath: [SchemaFilePath, FilePath]
	}
}

registerType("FilePath", {
	constructor: FilePath,
})
