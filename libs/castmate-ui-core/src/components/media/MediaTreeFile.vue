<template>
	<div
		class="media-tree-cell media-tree-file"
		:class="{ 'clickable-media-tree-item': hasClick }"
		:style="{ '--media-indent': indent ?? 0 }"
		@contextmenu="menu?.show($event)"
		@click="handleClick"
	>
		<div class="media-preview">
			<img v-if="isImagePreview" :src="file.metadata.file" class="thumbnail" />
			<sound-player v-else-if="file.metadata.audio && !file.metadata.video" :file="file.metadata.file" />
		</div>
		{{ file.metadata.name }}
	</div>
	<div class="media-tree-cell px-4" @contextmenu="menu?.show($event)" @click="handleClick">
		<div style="color: var(--text-color-secondary); font-size: small">
			<i class="mdi mdi-image" v-if="file.metadata.image"></i>
			<i class="mdi mdi-volume-high" v-if="file.metadata.audio"></i>
			<i class="mdi mdi-filmstrip" v-if="file.metadata.video"></i>
		</div>
	</div>
	<div
		class="media-tree-cell px-4"
		style="color: var(--text-color-secondary); font-size: small"
		@contextmenu="menu?.show($event)"
		@click="handleClick"
	>
		<duration-label :model-value="file.metadata.duration" v-if="file.metadata.duration" :decimal-places="1" />
	</div>
	<c-context-menu :items="contextOptions" ref="menu" />
</template>

<script setup lang="ts">
import path from "path"
import { DurationLabel, useMediaStore } from "../../main"
import { computed, ref } from "vue"
import SoundPlayer from "./SoundPlayer.vue"
import CContextMenu from "../util/CContextMenu.vue"
import type { MenuItem } from "primevue/menuitem"
import { MediaFile } from "castmate-schema"
import { MediaFileItem } from "./media-tree-types"

const props = defineProps<{
	file: MediaFileItem
	indent?: number
	onClick?: (file: MediaFile) => any
}>()

const emit = defineEmits(["click"])

const menu = ref<InstanceType<typeof CContextMenu>>()

const isImagePreview = computed(() => {
	if (props.file.metadata.image) return true
	const ext = path.extname(props.file.metadata.path)
	return [".gif", ".webp", ".apng"].includes(ext)
})

const mediaStore = useMediaStore()

const contextOptions = computed<MenuItem[]>(() => {
	return [
		{
			label: "Show In Explorer",
			icon: "mdi mdi-folder",
			command(event) {
				mediaStore.exploreMediaItem(props.file.metadata.path)
			},
		},
	]
})

const hasClick = computed(() => props.onClick != null)

function handleClick(ev: MouseEvent) {
	if (ev.button != 0) return

	ev.stopPropagation()
	ev.preventDefault()

	if (props.onClick) {
		emit("click", props.file.metadata.path)
	}
}
</script>

<style scoped>
.media-tree-cell {
	display: flex;
	flex-direction: row;
	align-items: center;
	border-top: solid 1px #2a2a2a;
	border-right: solid 1px #2a2a2a;
}

.media-tree-file {
	padding-left: calc(0.5rem + var(--media-indent) * var(--media-preview-size));
}

.media-preview {
	width: var(--media-preview-size);
	height: var(--media-preview-size);
	display: inline-flex;
	justify-content: center;
	align-items: center;
}
.thumbnail {
	max-width: var(--media-preview-size);
	max-height: var(--media-preview-size);
}

.media-preview {
	margin-right: 0.5rem;
}

.media-tree-item:nth-child(even) {
	background-color: var(--surface-a);
}

.media-tree-item:nth-child(odd) {
	background-color: #2a2a2a;
}

.clickable-media-tree-item {
	cursor: pointer;
}

.clickable-media-tree-item:hover {
	background-color: var(--surface-c);
}
</style>
