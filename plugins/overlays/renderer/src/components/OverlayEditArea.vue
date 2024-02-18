<template>
	<div
		ref="editArea"
		class="overlay-edit"
		:style="{
			'--overlay-width': `${modelValue.size.width}px`,
			'--overlay-height': `${modelValue.size.height}px`,
			'--zoom-scale': zoomScale,
		}"
	>
		<pan-area class="panner grid-paper" v-model:pan-state="view.editView.panState">
			<div class="overlay-boundary">
				<obs-preview class="preview-image" :obs-id="view.obsId" v-if="view.showPreview" />
			</div>
			<pan-area-resizable
				:show-drag="true"
				v-model:position="testPos"
				v-model:size="testSize"
				:scale-size="zoomScale"
			>
				hello?
			</pan-area-resizable>
		</pan-area>
	</div>
</template>

<script setup lang="ts">
import { PanArea, PanAreaResizable } from "castmate-ui-core"
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { OverlayEditorView } from "./overlay-edit-types"
import { ObsPreview } from "castmate-plugin-obs-renderer"
import { computed, ref, useModel } from "vue"
import { useElementSize } from "@vueuse/core"
const props = defineProps<{
	modelValue: OverlayConfig
	view: OverlayEditorView
}>()

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const editArea = ref<HTMLElement>()

const editSize = useElementSize(editArea)

const testPos = ref({
	x: 10,
	y: 10,
})

const testSize = ref({
	width: 100,
	height: 100,
})

const zoomScale = computed(() => {
	const horizontalScale = editSize.width.value / model.value.size.width
	const verticalScale = editSize.height.value / model.value.size.height
	return Math.min(horizontalScale, verticalScale)
})
</script>

<style scoped>
.overlay-edit {
	position: relative;
	width: 100%;
	height: 100%;
}
.grid-paper {
	background: linear-gradient(-90deg, var(--surface-d) 1px, transparent 1px),
		linear-gradient(0deg, var(--surface-d) 1px, transparent 1px);
	background-size: calc(var(--zoom-x) * var(--zoom-scale) * var(--overlay-width) / 10)
			calc(var(--zoom-y) * var(--zoom-scale) * var(--overlay-height) / 10),
		calc(var(--zoom-x) * var(--zoom-scale) * var(--overlay-width) / 10)
			calc(var(--zoom-y) * var(--zoom-scale) * var(--overlay-height) / 10);
	background-position-x: var(--pan-x), 0;
	background-position-y: 0, var(--pan-y);
}

.overlay-boundary {
	position: relative;
	border: 1px solid yellow;
	width: calc(var(--overlay-width) * var(--zoom-x) * var(--zoom-scale));
	height: calc(var(--overlay-height) * var(--zoom-y) * var(--zoom-scale));
}

.panner {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
}

.preview-image {
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
}
</style>
