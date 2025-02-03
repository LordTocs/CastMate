<template>
	<div class="empty-grid-span" v-if="noItemsAtAll"><slot name="noItems"></slot></div>
	<div class="empty-grid-span" v-else-if="noItemsFilter"><slot name="noFiltered"> </slot></div>
	<template v-else v-for="(item, i) in items">
		<media-tree-file
			v-if="item.type == 'file'"
			:name="item.name"
			:media="item.metadata"
			:indent="indent"
			@click="onClick"
			:key="item.metadata.path"
		/>
		<media-tree-folder
			v-else
			:files="item.files"
			:root="item.root"
			:name="item.name"
			:indent="indent"
			@click="onClick"
			:key="item.root"
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

const props = withDefaults(
	defineProps<{
		files: MediaFile[]
		filter?: string
		root: string
		index?: number
		indent?: number
		onClick?: (file: MediaFile) => any
		sound?: boolean
		image?: boolean
		video?: boolean
	}>(),
	{
		sound: true,
		image: true,
		video: true,
	}
)

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

const noItemsAtAll = computed(() => props.files.length == 0)
const noItemsFilter = computed(() => items.value.length == 0)

function matchesTypeFilter(media: MediaMetadata) {
	if (props.image && media.image) return true
	if (props.sound && media.audio) return true
	if (props.video && media.video) return true
	return false
}

const items = computed(() => {
	const filterLower = props.filter?.toLocaleLowerCase()

	const result: MediaItem[] = []
	for (const file of props.files) {
		const rel = path.relative(props.root, file)

		const parsed = path.parse(rel)

		if (filterLower && !parsed.name.toLocaleLowerCase().includes(filterLower)) {
			continue
		}

		const metadata = mediaStore.media[file]

		if (!matchesTypeFilter(metadata)) continue

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
				metadata,
			})
		}
	}
	return result
})
</script>

<style scoped>
.empty-grid-span {
	grid-column: 1 / -1;
	min-height: 5rem;
}
</style>
