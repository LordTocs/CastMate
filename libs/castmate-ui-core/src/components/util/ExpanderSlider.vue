<template>
	<div
		ref="sliderDiv"
		class="slider"
		:class="{ [direction]: true }"
		:style="{ backgroundColor: color }"
		@mousedown="onMouseDown"
	></div>
</template>

<script setup lang="ts">
import { Color } from "castmate-schema"
import { computed, ref, useModel } from "vue"
import { ClientPosition, DOMPos, getInternalMousePos } from "../../main"
import { useEventListener } from "@vueuse/core"

const props = withDefaults(
	defineProps<{
		modelValue: number
		color?: Color
		direction?: "vertical" | "horizontal"
		container: HTMLElement | undefined | null
		invert?: boolean
	}>(),
	{
		direction: "horizontal",
		invert: false,
	}
)

const model = useModel(props, "modelValue")

const sliderDiv = ref<HTMLElement>()
const dragging = ref(false)
const dragOffset = ref<DOMPos>({ x: 0, y: 0 })
const dragStartPos = ref<DOMPos>({ x: 0, y: 0 })
const dragStartValue = ref(0)

function onMouseDown(ev: MouseEvent) {
	if (ev.button != 0) return
	if (!sliderDiv.value) return
	if (!props.container) return

	dragging.value = true

	dragOffset.value = getInternalMousePos(sliderDiv.value, ev)
	const startPos = getInternalMousePos(props.container, ev)
	startPos.x -= dragOffset.value.x
	startPos.y -= dragOffset.value.y
	dragStartPos.value = startPos
	dragStartValue.value = model.value

	ev.preventDefault()
}

function calcNewValue(ev: ClientPosition) {
	if (!sliderDiv.value) return
	if (!props.container) return

	const newPos = getInternalMousePos(props.container, ev)
	newPos.x -= dragOffset.value.x
	newPos.y -= dragOffset.value.y

	if (props.direction == "horizontal") {
		const diff = newPos.y - dragStartPos.value.y
		model.value = dragStartValue.value + diff * (props.invert ? -1 : 1)
	} else {
		const diff = newPos.x - dragStartPos.value.x
		model.value = dragStartValue.value + diff * (props.invert ? -1 : 1)
	}
}

useEventListener(
	() => (dragging.value ? window : null),
	"mousemove",
	(ev: MouseEvent) => {
		calcNewValue(ev)
	}
)

useEventListener(
	() => (dragging.value ? window : null),
	"mouseup",
	(ev: MouseEvent) => {
		dragging.value = false
		calcNewValue(ev)
	}
)
</script>

<style scoped>
.slider.horizontal {
	height: 3px;
	cursor: ns-resize;
}

.slider.vertical {
	width: 3px;
	cursor: ew-resize;
}

.slider {
	background-color: var(--surface-border);
}
</style>
