<template>
	<template v-for="(item, i) in items">
		<media-tree-file
			v-if="item.type == 'file'"
			:file="item"
			@click="onClick"
			:key="item.metadata.path"
			:indent="indent"
		/>
		<media-tree-folder
			v-else-if="item.type == 'folder'"
			:folder="item"
			:indent="indent"
			@click="onClick"
			:key="item.root"
			:filtering="filtering"
			:allow-drop="allowDrop"
		/>
	</template>
</template>

<script setup lang="ts">
import { MediaFile } from "castmate-schema"
import MediaTreeFile from "./MediaTreeFile.vue"
import MediaTreeFolder from "./MediaTreeFolder.vue"
import { MediaTreeItem } from "./media-tree-types"

const props = withDefaults(
	defineProps<{
		items: Record<string, MediaTreeItem>
		index?: number
		indent?: number
		filtering?: boolean
		allowDrop?: boolean
		onClick?: (file: MediaFile) => any
	}>(),
	{}
)
</script>

<style scoped></style>
