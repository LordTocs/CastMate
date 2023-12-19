<template>
	<template v-for="(item, i) in items">
		<media-tree-file
			v-if="item.type == 'file'"
			:name="item.name"
			:media="item.metadata"
			:indent="indent"
			@click="onClick"
		/>
		<media-tree-folder
			v-else
			:files="item.files"
			:root="item.root"
			:name="item.name"
			:indent="indent"
			@click="onClick"
		/>
	</template>
</template>

<script setup lang="ts">
import { MediaFile, MediaMetadata } from "castmate-schema"
import { computed } from "vue"
import { useMediaStore } from "../../main"
import MediaTreeFile from "./MediaTreeFile.vue"
import MediaTreeFolder from "./MediaTreeFolder.vue"
import path from "path"

const props = defineProps<{
	files: MediaFile[]
	filter?: string
	root: string
	index?: number
	indent?: number
	onClick?: (file: MediaFile) => any
}>()

const mediaStore = useMediaStore()

interface MediaFileItem {
	type: "file"
	name: string
	metadata: MediaMetadata
}

interface MediaSubFolderItem {
	type: "folder"
	name: string
	root: string
	files: MediaFile[]
}

type MediaItem = MediaFileItem | MediaSubFolderItem

const items = computed(() => {
	const result: MediaItem[] = []
	for (const file of props.files) {
		const rel = path.relative(props.root, file)

		const parsed = path.parse(rel)
		const parts = parsed.dir.split("\\")
		if (parsed.dir.length > 0) {
			//Subfolder
			const subroot = path.join(props.root, parts[0])

			const existing = result.find((v): v is MediaSubFolderItem => {
				if (v.type != "folder") return false
				if (v.root == subroot) return true
				return false
			})

			if (existing) {
				existing.files.push(file)
			} else {
				result.push({
					type: "folder",
					name: parts[0],
					root: subroot,
					files: [file],
				})
			}
		} else {
			result.push({
				type: "file",
				name: parsed.base,
				metadata: mediaStore.media[file],
			})
		}
	}
	return result
})
</script>
