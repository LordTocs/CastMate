<template>
	<div
		class="preview"
		v-if="preview"
		:style="{
			zoom: previewScale,
			'--preview-offset-x': `${preview.offsetX * previewScale}px`,
			'--preview-offset-y': `${preview.offsetY * previewScale}px`,
		}"
	>
		<obs-preview class="preview-image" :obs-id="view.obsId" v-if="preview.source == 'obs'" />
		<img :src="preview.source" v-else-if="preview.source" />
	</div>
</template>

<script setup lang="ts">
import { usePanState } from "castmate-ui-core"
import { OverlayPreviewConfig } from "castmate-plugin-overlays-shared"
import { ComputedRef, computed, inject } from "vue"
import { ObsPreview } from "castmate-plugin-obs-renderer"
import { OverlayEditorView } from "./overlay-edit-types"

const props = defineProps<{
	preview: OverlayPreviewConfig | undefined
	view: OverlayEditorView
}>()

const panState = usePanState()

const zoomScale = inject<ComputedRef<number>>(
	"overlay-zoom-scale",
	computed(() => 1)
)

const previewScale = computed<number>(() => {
	//Assume zoomX and zoomY are the same
	return panState.value.zoomX * zoomScale.value
})
</script>

<style scoped></style>
