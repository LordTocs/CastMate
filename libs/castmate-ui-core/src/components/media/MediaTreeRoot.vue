<template>
	<div class="empty-grid-span" v-if="noItemsAtAll"><slot name="noItems"></slot></div>
	<div class="empty-grid-span" v-else-if="noItemsFilter"><slot name="noFiltered"> </slot></div>
	<div class="media-grid" v-bind="$attrs" v-else>
		<media-tree :items="items" :allow-drop="allowDrop" :filtering="Boolean(filter)" @click="onClick" />
	</div>
</template>

<script setup lang="ts">
import { MediaFile, MediaMetadata } from "castmate-schema"
import { computed } from "vue"
import { useMediaStore } from "../../main"
import { useMediaFileTree } from "./media-tree-types"

import MediaTree from "./MediaTree.vue"

const props = withDefaults(
	defineProps<{
		filter?: string
		root: string
		index?: number
		indent?: number
		onClick?: (file: MediaFile) => any
		sound?: boolean
		image?: boolean
		video?: boolean
		allowDrop?: boolean
	}>(),
	{
		sound: true,
		image: true,
		video: true,
	}
)

const items = useMediaFileTree(() => props)

const mediaStore = useMediaStore()

const noItemsAtAll = computed(() => mediaStore.mediaKeys.length == 0)
const noItemsFilter = computed(() => Object.keys(items.value).length == 0)
</script>

<style scoped>
.empty-grid-span {
	grid-column: 1 / -1;
	min-height: 5rem;
}

.media-grid {
	display: grid;
	grid-template-columns: 1fr fit-content(100px) fit-content(150px);
	gap: 0 2px;
}
</style>
