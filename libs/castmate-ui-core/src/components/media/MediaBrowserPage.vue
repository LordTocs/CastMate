<template>
	<scrolling-tab-body class="media-browser">
		<div class="flex align-items-center">
			<p-button @click="openMediaFolder">Open Media Folder</p-button>
			<div class="flex-grow-1" />
			<span class="p-input-icon-left">
				<i class="pi pi-search" />
				<p-input-text v-model="filters['global'].value" placeholder="Search" />
			</span>
		</div>
		<table style="width: 100%">
			<tr>
				<th>Media</th>
				<th>Type</th>
				<th>Duration</th>
			</tr>
			<media-tree root="default" :files="mediaItems.map((i) => i.path)" />
		</table>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useMediaStore } from "../../media/media-store.ts"
import MediaTree from "./MediaTree.vue"
import PDataTable from "primevue/datatable"
import PInputText from "primevue/inputtext"
import { FilterMatchMode } from "primevue/api"
import PColumn from "primevue/column"
import { MediaMetadata } from "castmate-schema"
import path from "path"
import { useElementSize } from "@vueuse/core"
import PButton from "primevue/button"

import SoundPlayer from "./SoundPlayer.vue"
import { ScrollingTabBody } from "../../main"

const filters = ref({
	global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const mediaStore = useMediaStore()
const mediaItems = computed(() => Object.values(mediaStore.media))
const containerDiv = ref<HTMLElement | null>(null)

function openMediaFolder() {
	mediaStore.openMediaFolder()
}

function isImagePreview(media: MediaMetadata) {
	if (media.image) return true
	const ext = path.extname(media.path)
	return [".gif", ".webp", ".apng"].includes(ext)
}
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

.thumbnail {
	max-width: 100px;
	max-height: 100px;
}

.media-browser {
	--media-preview-size: 50px;
}
</style>
