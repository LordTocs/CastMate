<template>
	<div class="duration-handle" :class="{ dragging }" ref="handle" @mousedown="onMouseDown" tabindex="-1"></div>
</template>

<script setup lang="ts">
import { useEventListener, useVModel, useElementSize } from "@vueuse/core"
import { type PanState, usePanState, usePanQuery, getInternalMousePos } from "castmate-ui-core"
import { ref, type Ref, inject, computed } from "vue"
import { automationTimeScale } from "./automation-shared"

const props = defineProps<{
	modelValue: number | undefined
	min?: number
	max?: number
	left: boolean
	otherValue: number
}>()
const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)

const handle = ref<HTMLElement | null>(null)

const dragging = ref(false)
const distFromDragEdge = ref(0)
const dragStartDuration = ref(0)
const startingEdgePanPos = ref(0)
const startingPanX = ref(0)

const actionElement = inject<Ref<HTMLElement | null>>("actionElement")

const panState = usePanState()
const panQuery = usePanQuery()

function computeOffset(ev: MouseEvent) {
	if (!actionElement?.value) {
		return 0
	}
	const rect = actionElement.value.getBoundingClientRect()
	if (!props.left) {
		//Return distance from right side
		const x = ev.clientX - rect.right
		return x
	} else {
		//Return distance from the left side
		const x = ev.clientX - rect.left
		return x
	}
}

function computeWidth(ev: MouseEvent) {
	if (!actionElement?.value) {
		return 0
	}
	const rect = actionElement.value.getBoundingClientRect()

	if (props.left) {
		return rect.right - ev.clientX
	} else {
		return ev.clientX - rect.left
	}
}

function adjustPos(ev: MouseEvent) {
	if (!actionElement?.value) return

	//Calculate where the new edge SHOULD be

	const pos = getInternalMousePos(actionElement?.value, ev)
	//Distance from the right edge of the action element
	const newEdgePos = pos.x - distFromDragEdge.value

	let newWidth = computeWidth(ev)

	let duration = 0

	if (props.left) {
		duration = (newWidth + distFromDragEdge.value) / (panState.value.zoomX * automationTimeScale)
		duration = props.otherValue - duration
	} else {
		duration = (newWidth - distFromDragEdge.value) / (panState.value.zoomX * automationTimeScale)
		console.log(duration)
		duration = duration + props.otherValue
	}

	console.log(newWidth, distFromDragEdge.value, props.otherValue, duration)

	if (props.max != null) {
		duration = Math.min(duration, props.max)
	}

	if (props.min != null) {
		duration = Math.max(duration, props.min)
	}

	if (props.left) {
		const panDiff = (duration - dragStartDuration.value) * (panState.value.zoomX * automationTimeScale)
		panState.value.panX = startingPanX.value + panDiff
	}

	modelObj.value = duration
}

function onMouseDown(ev: MouseEvent) {
	if (ev.button == 0) {
		dragging.value = true

		distFromDragEdge.value = computeOffset(ev)
		startingPanX.value = panState.value.panX
		startingEdgePanPos.value = panQuery.computePosition({
			clientX: ev.clientX - distFromDragEdge.value,
			clientY: ev.clientY,
		}).x
		dragStartDuration.value = modelObj.value || 0
		//Pull focus
		handle.value?.focus()
		ev.stopPropagation()
		ev.preventDefault()
	}
}

useEventListener(window, "mousemove", (ev: MouseEvent) => {
	if (!dragging.value) {
		return
	}

	adjustPos(ev)
})

useEventListener(window, "mouseup", (ev: MouseEvent) => {
	if (ev.button == 0 && dragging.value) {
		dragging.value = false
		adjustPos(ev)

		ev.preventDefault()
		ev.stopPropagation()
	}
})
</script>

<style scoped>
.duration-handle {
	width: 8px;
	height: 100%;
	background-color: var(--lighter-action-color);
	cursor: ew-resize;
	flex-shrink: 0;
	flex-grow: 0;
}

.dragging {
	background-color: white;
}
</style>
