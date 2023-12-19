<template>
	<tr class="media-tree-item" @click="toggleOpen" :style="{ '--media-indent': indent ?? 0 }">
		<td colspan="3" class="media-tree-folder-header">
			<div class="media-folder-spacer">
				<i class="mdi mdi-folder" v-if="!open" />
				<i class="mdi mdi-folder-open" v-else />
			</div>
			{{ name }}
		</td>
	</tr>
	<media-tree :root="root" :files="files" v-if="open" :indent="(indent ?? 0) + 1"></media-tree>
</template>

<script setup lang="ts">
import { MediaFile } from "castmate-schema"
import { computed, ref } from "vue"
import MediaTree from "./MediaTree.vue"

const props = defineProps<{
	name: string
	root: string
	files: MediaFile[]
	indent?: number
}>()

const open = ref(false)

function toggleOpen(ev: MouseEvent) {
	if (ev.button == 0) {
		ev.stopPropagation()
		ev.preventDefault()
		open.value = !open.value
	}
}
</script>

<style scoped>
.media-tree-folder-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	cursor: pointer;
	user-select: none;
	padding-left: calc(0.5rem + var(--media-indent) * var(--media-preview-size));
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
</style>
