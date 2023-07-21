<template>
	<div class="duration-handle" :class="{ dragging }" ref="handle" @mousedown="onMouseDown"></div>
</template>

<script setup lang="ts">
import { useEventListener, useVModel, useElementSize } from "@vueuse/core"
import { type PanState, usePanState } from "castmate-ui-core"
import { ref, type Ref, inject, computed } from "vue"

const props = defineProps<{
	modelValue: number
}>()
const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)

const handle = ref<HTMLElement | null>(null)

const panning = inject<PanState>("panState")

const dragging = ref(false)
const dragOffset = ref(0)

const actionElement = inject<Ref<HTMLElement | null>>("actionElement")

const panState = usePanState()

function computePos(ev: MouseEvent) {
	if (!actionElement?.value) {
		return { x: 0, y: 0 }
	}

	const rect = actionElement.value.getBoundingClientRect()

	const x = ev.clientX - rect.left
	const y = ev.clientY - rect.top

	return { x, y }
}

function computeOffset(ev: MouseEvent) {
	if (!actionElement?.value) {
		return { x: 0, y: 0 }
	}

	const rect = actionElement.value.getBoundingClientRect()

	const x = ev.clientX - rect.right
	const y = ev.clientY - rect.bottom

	return { x, y }
}

function adjustPos(ev: MouseEvent) {
	const pos = computePos(ev)

	const posDiff = pos.x - dragOffset.value
	const duration = posDiff / ((panState?.value.zoomX ?? 1) * 40)

	modelObj.value = duration
}

function onMouseDown(ev: MouseEvent) {
	if (ev.button == 0) {
		dragging.value = true
		const offset = computeOffset(ev)

		dragOffset.value = offset.x
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
}

.dragging {
	background-color: white;
}
</style>
