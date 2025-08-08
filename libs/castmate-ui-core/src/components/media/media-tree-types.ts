import { MediaFile, MediaMetadata, normalizeMediaPath } from "castmate-schema"
import path from "path"
import { MediaStore, useMediaStore } from "../../main"
import { computed, MaybeRefOrGetter, toValue } from "vue"

export interface MediaFileItem {
	type: "file"
	name: string
	metadata: MediaMetadata
}

export interface MediaSubFolderItem {
	type: "folder"
	name: string
	root: string
	items: Record<string, MediaTreeItem>
}

export type MediaTreeItem = MediaFileItem | MediaSubFolderItem

interface MediaFiltering {
	filter?: string
	root: string
	image: boolean
	sound: boolean
	video: boolean
}

function matchesTypeFilter(media: MediaMetadata, filtering: MediaFiltering) {
	if (filtering.image && media.image) return true
	if (filtering.sound && media.audio) return true
	if (filtering.video && media.video) return true
	return false
}

function sortTree(tree: Record<string, MediaTreeItem>) {}

export function treeifyMediaFile(files: MediaFile[], filtering: MediaFiltering, mediaStore: MediaStore) {
	const filterLower = filtering.filter?.toLocaleLowerCase()

	const tree: Record<string, MediaTreeItem> = {}

	const root = normalizeMediaPath(filtering.root)

	for (const file of files) {
		const rel = path.relative(root, file)
		console.log("Treeify Parse", file, rel)
		const parsed = path.parse(rel)

		if (filterLower && !parsed.name.toLocaleLowerCase().includes(filterLower)) continue

		const metadata = mediaStore.media[file]

		if (!matchesTypeFilter(metadata, filtering)) continue

		let itemDict = tree

		if (parsed.dir.length > 0) {
			const parts = parsed.dir.split("\\")

			let root = filtering.root

			for (const part of parts) {
				const existing = itemDict[part]

				root = path.join(root, part)

				if (!existing) {
					itemDict[part] = {
						type: "folder",
						name: part,
						root,
						items: {},
					}

					itemDict = itemDict[part].items
					continue
				}
				if (existing.type == "file") break

				itemDict = existing.items
			}
		}

		itemDict[parsed.base] = {
			type: "file",
			name: parsed.base,
			metadata,
		}
	}

	//Sorting

	return tree
}

export function useMediaFileTree(filtering: MaybeRefOrGetter<MediaFiltering>) {
	const mediaStore = useMediaStore()

	return computed(() => {
		const sorted = Object.keys(mediaStore.media).sort((a, b) => a.localeCompare(b))

		return treeifyMediaFile(sorted, toValue(filtering), mediaStore)
	})
}
