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
import { PanQuery, PanState } from "../../util/panning"
import { computed, ref, provide, toRaw, markRaw } from "vue"
import { getInternalMousePos, usePropagationStop } from "../../main"

const props = withDefaults(
	defineProps<{
		zoomX?: boolean
		zoomY?: boolean
		panState: PanState
		maxZoomX?: number
		maxZoomY?: number
		minZoomX?: number
		minZoomY?: number
	}>(),
	{
		zoomX: true,
		zoomY: true,
		minZoomX: 0.01,
		minZoomY: 0.01,
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

provide<PanQuery>("panQuery", {
	computePosition(ev: { clientX: number; clientY: number }) {
		if (!panner.value) return { x: 0, y: 0 }
		return getInternalMousePos(panner.value, ev)
	},
	getPanClientRect() {
		return panner.value?.getBoundingClientRect() ?? DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 })
	},
})

const panStartPos = ref<{ x: number; y: number } | null>(null)
const panStart = ref<{ panX: number; panY: number } | null>(null)

const stopPropagation = usePropagationStop()

function onMouseWheel(ev: WheelEvent) {
	if (panState.value.panning) {
		ev.preventDefault()
		stopPropagation(ev)
		return
	}
	if (ev.ctrlKey) {
		if (!panArea.value) return

		const mpos = computePosition(ev)

		const deltaZoom = -(ev.deltaY / 100) * 0.08
		if (props.zoomX) {
			const panX = panStateObj.value.panX
			const zoomX = panStateObj.value.zoomX

			const posX = (mpos.x - panX) / zoomX

			const newZoomX = Math.max(zoomX + deltaZoom, props.minZoomX)

			const newPanX = -(posX * newZoomX - mpos.x)

			console.log(`zoomX: ${zoomX} nzoomX: ${newZoomX}`)
			console.log(`mX: ${mpos.x} posX: ${posX} panX: ${panX} npanX: ${newPanX}`)

			panStateObj.value.panX = newPanX
			panStateObj.value.zoomX = newZoomX
		}
		if (props.zoomY) {
			const panY = panStateObj.value.panY
			const zoomY = panStateObj.value.zoomY

			const posY = (mpos.y - panY) / zoomY

			const newZoomY = Math.max(zoomY + deltaZoom, props.minZoomY)

			const newPanY = -(posY * newZoomY - mpos.y)

			panStateObj.value.panY = newPanY
			panStateObj.value.zoomY += deltaZoom
		}
		ev.preventDefault()
		stopPropagation(ev)
	}
}

function onMouseDown(ev: MouseEvent) {
	if (ev.button == 1) {
		//1 is the middle mouse. Maybe use enum W3C!
		panStateObj.value.panning = true

		panStartPos.value = computePosition(ev)
		panStart.value = { panX: panState.value.panX, panY: panState.value.panY }

		ev.preventDefault()
		stopPropagation(ev)
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
