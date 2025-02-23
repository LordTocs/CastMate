<template>
	<scrolling-tab-body class="media-browser" inner-class="media-folder flex flex-column" ref="tabBody">
		<div class="flex align-items-center p-3">
			<p-button @click="openMediaFolder">Open Media Folder</p-button>
			<div class="flex-grow-1" />
			<!-- <span class="p-input-icon-left">
				<i class="pi pi-search" />
				<p-input-text v-model="filters['global'].value" placeholder="Search" />
			</span> -->
		</div>

		<div class="flex-grow-1" :class="{ 'file-hover': hoveringFiles }">
			<media-tree-root root="default" allow-drop />
		</div>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useMediaStore } from "../../media/media-store.ts"
import MediaTree from "./MediaTree.vue"
import MediaTreeRoot from "./MediaTreeRoot.vue"
import PDataTable from "primevue/datatable"
import PInputText from "primevue/inputtext"
//import { FilterMatchMode } from "primevue/api"
import PColumn from "primevue/column"
import { MediaMetadata } from "castmate-schema"
import path from "path"
import { useElementSize } from "@vueuse/core"
import PButton from "primevue/button"

import SoundPlayer from "./SoundPlayer.vue"
import { ScrollingTabBody } from "../../main"

import { useMediaDrop } from "../../media/media-store"

// const filters = ref({
// 	global: { value: null, matchMode: FilterMatchMode.CONTAINS },
// })

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
