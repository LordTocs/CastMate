<template>
	<tr class="media-tree-item" :style="{ '--media-indent': indent ?? 0 }" @contextmenu="menu?.show($event)">
		<td class="media-tree-file">
			<div class="media-preview">
				<img v-if="isImagePreview" :src="media.file" class="thumbnail" />
				<sound-player v-else-if="media.audio && !media.video" :file="media.file" />
			</div>
			{{ name }}
		</td>
		<td class="column-fit-width px-2">
			<div style="color: var(--text-color-secondary); font-size: small">
				<i class="mdi mdi-image" v-if="media.image"></i>
				<i class="mdi mdi-volume-high" v-if="media.audio"></i>
				<i class="mdi mdi-filmstrip" v-if="media.video"></i>
			</div>
		</td>
		<td class="column-fit-width">
			<duration-label
				style="color: var(--text-color-secondary); font-size: small"
				:model-value="media.duration"
				v-if="media.duration"
			/>
		</td>
	</tr>
	<c-context-menu :items="contextOptions" ref="menu" />
</template>

<script setup lang="ts">
import path from "path"
import { MediaMetadata } from "castmate-schema"
import { DurationLabel, useMediaStore } from "../../main"
import { computed, ref } from "vue"
import SoundPlayer from "./SoundPlayer.vue"
import CContextMenu from "../util/CContextMenu.vue"
import { MenuItem } from "primevue/menuitem"

const props = defineProps<{
	name: string
	media: MediaMetadata
	indent?: number
}>()

const menu = ref<InstanceType<typeof CContextMenu>>()

const isImagePreview = computed(() => {
	if (props.media.image) return true
	const ext = path.extname(props.media.path)
	return [".gif", ".webp", ".apng"].includes(ext)
})

const mediaStore = useMediaStore()

const contextOptions = computed<MenuItem[]>(() => {
	return [
		{
			label: "Show In Explorer",
			icon: "mdi mdi-folder",
			command(event) {
				mediaStore.exploreMediaItem(props.media.path)
			},
		},
	]
})
</script>

<style scoped>
.media-tree-file {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding-left: calc(0.5rem + var(--media-indent) * var(--media-preview-size));
}

.media-preview {
	width: var(--media-preview-size);
	height: var(--media-preview-size);
	display: flex;
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
</style>
