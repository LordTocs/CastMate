<template>
	<div class="media-tree-subgrid media-folder" :class="{ 'file-hover': hoveringFiles }" ref="folderElement">
		<div
			class="media-folder-row media-tree-folder-header"
			@click="toggleOpen"
			:style="{ '--media-indent': indent ?? 0 }"
		>
			<div class="media-folder-spacer">
				<i class="mdi mdi-folder" v-if="!open" />
				<i class="mdi mdi-folder-open" v-else />
			</div>
			{{ name }}
		</div>
		<media-tree :root="root" :files="files" v-if="open" :indent="(indent ?? 0) + 1" @click="onClick"></media-tree>
	</div>
</template>

<script setup lang="ts">
import { MediaFile } from "castmate-schema"
import { computed, ref } from "vue"
import MediaTree from "./MediaTree.vue"
import { usePropagationStop } from "../../main"

import { useMediaDrop } from "../../main"

const props = defineProps<{
	name: string
	root: string
	files: MediaFile[]
	indent?: number
	onClick?: (file: MediaFile) => any
	allowDrop?: boolean
}>()

const open = ref(false)

const stopPropagation = usePropagationStop()

function toggleOpen(ev: MouseEvent) {
	if (ev.button == 0) {
		stopPropagation(ev)
		ev.preventDefault()
		open.value = !open.value
	}
}

const fixedRoot = computed(() => {
	return `${props.root.startsWith("/") ? "" : "/"}${props.root.replace("\\", "/")}`
})

const folderElement = ref<HTMLElement>()
const { hoveringFiles } = useMediaDrop(() => (true ? folderElement.value : undefined), fixedRoot, "media-folder")
</script>

<style scoped>
.media-tree-subgrid {
	display: grid;
	grid-column-start: 1;
	grid-column-end: 4;
	grid-template-columns: subgrid;
	grid-template-columns: subgrid;
}

.media-tree-folder-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	cursor: pointer;
	user-select: none;
	padding-left: calc(0.5rem + var(--media-indent) * var(--media-preview-size));
	border-top: solid 1px #2a2a2a;
}
.media-folder-spacer {
	width: var(--media-preview-size);
	height: var(--media-preview-size);
	margin-right: 0.5rem;
	display: inline-block;
}

.media-folder-spacer i {
	font-size: var(--media-preview-size);
}

.media-tree-item:nth-child(even) {
	background-color: var(--surface-a);
}

.media-tree-item:nth-child(odd) {
	background-color: #2a2a2a;
}

.media-folder-row {
	grid-column-start: 1;
	grid-column-end: 4;
}

.file-hover {
	border: solid 2px var(--p-primary-color);
}
</style>
