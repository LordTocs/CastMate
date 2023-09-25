<template>
	<div
		class="pan-area"
		:class="{ panning: panState.panning }"
		ref="panArea"
		:style="{
			'--zoom-x': `${panState.zoomX}`,
			'--pan-x': `${panState.panX}px`,
			'--zoom-y': `${panState.zoomY}`,
			'--pan-y': `${panState.panY}px`,
		}"
		@wheel="onMouseWheel"
		@mousedown="onMouseDown"
		@mousemove="onMouseMove"
	>
		<div class="panner" ref="panner">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useEventListener, useVModel } from "@vueuse/core"
import { PanState } from "../../util/panning"
import { computed, ref, provide, toRaw, markRaw } from "vue"
import { getInternalMousePos } from "../../main"

const props = withDefaults(
	defineProps<{
		zoomX?: boolean
		zoomY?: boolean
		panState: PanState
	}>(),
	{
		zoomX: true,
		zoomY: true,
		panState: () => ({
			panX: 0,
			panY: 0,
			zoomX: 1,
			zoomY: 1,
			panning: false,
		}),
	}
)

const emit = defineEmits(["update:panState"])

const panStateObj = useVModel(props, "panState", emit)
const panState = computed<PanState>(() => panStateObj.value)
provide("panState", panStateObj)

const panArea = ref<HTMLElement | null>(null)
const panner = ref<HTMLElement | null>(null)

function computePosition(ev: { clientX: number; clientY: number }) {
	if (!panArea.value) {
		return { x: 0, y: 0 }
	}

	const bounds = panArea.value.getBoundingClientRect()

	const x = ev.clientX - bounds.left
	const y = ev.clientY - bounds.top
	return { x, y }
}

provide("panQuery", {
	computePosition(ev: { clientX: number; clientY: number }) {
		if (!panner.value) return { x: 0, y: 0 }
		return getInternalMousePos(panner.value, ev)
	},
})

const panStartPos = ref<{ x: number; y: number } | null>(null)
const panStart = ref<{ panX: number; panY: number } | null>(null)

function onMouseWheel(ev: WheelEvent) {
	if (panState.value.panning) {
		ev.preventDefault()
		ev.stopPropagation()
		return
	}
	if (ev.ctrlKey) {
		console.log(ev.deltaY)
		if (props.zoomX) {
			panStateObj.value.zoomX -= (ev.deltaY / 100) * 0.08
		}
		if (props.zoomY) {
			panStateObj.value.zoomY -= (ev.deltaY / 100) * 0.08
		}
		ev.preventDefault()
		ev.stopPropagation()
	}
}

function onMouseDown(ev: MouseEvent) {
	if (ev.button == 1) {
		//1 is the middle mouse. Maybe use enum W3C!
		panStateObj.value.panning = true

		panStartPos.value = computePosition(ev)
		panStart.value = { panX: panState.value.panX, panY: panState.value.panY }

		ev.preventDefault()
		ev.stopPropagation()
	}
}

function onMouseMove(ev: MouseEvent) {
	if (panStateObj.value.panning) {
		const pos = computePosition(ev)

		if (!panStartPos.value || !panStart.value) {
			return
		}

		const offset = { x: pos.x - panStartPos.value.x, y: pos.y - panStartPos.value.y }

		panStateObj.value.panX = panStart.value.panX + offset.x
		panStateObj.value.panY = panStart.value.panY + offset.y
	}
}

useEventListener(window, "mouseup", (ev: MouseEvent) => {
	if (panStateObj.value.panning) {
		panStateObj.value.panning = false
	}
})
</script>

<style scoped>
.pan-area {
	position: relative;
	overflow: hidden;
}

.panner {
	position: absolute;

	left: var(--pan-x);
	top: var(--pan-y);
}
</style>
