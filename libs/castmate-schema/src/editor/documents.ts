import * as path from "path"

export interface ParsedDocumentPath {
	fullPath: string
	id: string
	slug: string
	ext: string
}

export function parseDocumentPath(filepath: string) {
	const parsedPath = path.parse(filepath)
	const parsedName = parsedPath.name.split(".")
	if (parsedName.length == 2) {
		const [id, slug] = parsedName
		//invoke slug from document resource registry
		return {
			fullPath: filepath,
			id,
			slug,
			ext: parsedPath.ext,
		} as ParsedDocumentPath
	}
	return undefined
}

export interface ProjectTreeFileInfo {
	plugin: string
	type: string
	id: string
	name: string
}

export interface ProjectTreeFolderInfo {
	name: string
	items: ProjectTreeNode[]
}

export type ProjectTreeNode = ProjectTreeFileInfo | ProjectTreeFolderInfo

export function isDocumentInfo(item: ProjectTreeNode): item is ProjectTreeFileInfo {
	return item && "plugin" in item && "type" in item
}

export function isDoumentFolderInfo(item: ProjectTreeNode): item is ProjectTreeFolderInfo {
	return item && "items" in item
}
