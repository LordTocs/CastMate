<template>
	<scrolling-tab-body class="media-browser" inner-class="media-folder flex flex-column" ref="tabBody">
		<div class="flex align-items-center p-3">
			<p-button @click="openMediaFolder">Open Media Folder</p-button>
			<div class="flex-grow-1" />
			<p-icon-field>
				<p-input-icon class="pi pi-search" />
				<p-input-text v-model="filter" placeholder="Search" />
			</p-icon-field>
		</div>

		<div class="flex-grow-1" :class="{ 'file-hover': hoveringFiles }">
			<media-tree-root root="default" allow-drop :filter="filter" />
		</div>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useMediaStore } from "../../media/media-store.ts"

import MediaTreeRoot from "./MediaTreeRoot.vue"

import PInputText from "primevue/inputtext"
import PIconField from "primevue/iconfield"
import PInputIcon from "primevue/inputicon"

import { MediaMetadata } from "castmate-schema"
import path from "path"
import PButton from "primevue/button"

import { ScrollingTabBody } from "../../main"

import { useMediaDrop } from "../../media/media-store"

const filter = ref("")

const mediaStore = useMediaStore()
const mediaItems = computed(() => {
	const itemPaths = Object.values(mediaStore.media)
	itemPaths.sort((a, b) => a.path.localeCompare(b.path))
	return itemPaths
})
const containerDiv = ref<HTMLElement | null>(null)

function openMediaFolder() {
	mediaStore.openMediaFolder()
}

function isImagePreview(media: MediaMetadata) {
	if (media.image) return true
	const ext = path.extname(media.path)
	return [".gif", ".webp", ".apng"].includes(ext)
}

const tabBody = ref<InstanceType<typeof ScrollingTabBody>>()

const { hoveringFiles } = useMediaDrop(() => tabBody.value?.scrollDiv, "/default", "media-folder")
</script>

<style scoped>
.container {
	position: relative;
}

.inner-container {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	overflow: hidden;
}

.media-browser {
	--media-preview-size: 50px;
}

.file-hover {
	border: solid 2px var(--p-primary-color);
}
</style>
