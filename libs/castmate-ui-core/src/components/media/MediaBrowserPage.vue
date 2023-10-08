<template>
	<div class="container">
		<div class="inner-container" ref="containerDiv">
			<p-data-table
				v-model:filters="filters"
				:value="mediaItems"
				data-key="path"
				:global-filter-fields="['path']"
				style="width: 100%; max-height: 100%"
				scrollable
				class="flex flex-column"
			>
				<template #header>
					<div class="flex justify-content-end">
						<span class="p-input-icon-left">
							<i class="pi pi-search" />
							<p-input-text v-model="filters['global'].value" placeholder="Search" />
						</span>
					</div>
				</template>
				<p-column header="Type">
					<template #body="{ data }">
						<i class="mdi mdi-image" v-if="data.image"></i>
						<i class="mdi mdi-volume-high" v-if="data.audio"></i>
						<i class="mdi mdi-filmstrip" v-if="data.video"></i>
					</template>
				</p-column>
				<p-column field="path" header="Path" sortable> </p-column>
				<p-column field="duration" header="Length" sortable>
					<template #body="{ data }">
						<span v-if="data.duration">{{ data.duration?.toFixed(2) }}s</span>
					</template>
				</p-column>
				<p-column header="Preview">
					<template #body="{ data }">
						<img v-if="isImagePreview(data)" :src="data.file" class="thumbnail" />
						<sound-player v-else-if="data.audio && !data.video" :file="data.file" />
					</template>
				</p-column>
			</p-data-table>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useMediaStore } from "../../media/media-store.ts"
import PDataTable from "primevue/datatable"
import PInputText from "primevue/inputtext"
import { FilterMatchMode } from "primevue/api"
import PColumn from "primevue/column"
import { MediaMetadata } from "castmate-schema"
import path from "path"
import { useElementSize } from "@vueuse/core"

import SoundPlayer from "./SoundPlayer.vue"

const filters = ref({
	global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const mediaStore = useMediaStore()
const mediaItems = computed(() => Object.values(mediaStore.media))
const containerDiv = ref<HTMLElement | null>(null)

const containerSize = useElementSize(containerDiv)

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
</style>
