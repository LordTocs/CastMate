<template>
	<div class="gradient-drag" ref="gradientDrag" @mousedown="onMouseDown" @click="onClick"></div>
	<drop-down-panel class="p-1" v-model="overlayVisible" :container="container">
		<template v-if="model">
			<c-color-picker v-model="model.color" alpha />
		</template>
	</drop-down-panel>
</template>

<script setup lang="ts">
import { useElementSize, useEventListener } from "@vueuse/core"
import { WidgetGradientStop } from "castmate-plugin-overlays-shared"
import { Color } from "castmate-schema"
import {
	ClientPosition,
	DOMPos,
	getInternalMousePos,
	useDefaultableModel,
	DropDownPanel,
	CColorPicker,
	usePropagationStop,
	usePropagationImmediateStop,
} from "castmate-ui-core"
import { ref, useTemplateRef } from "vue"

const model = defineModel<WidgetGradientStop>()

const props = defineProps<{
	container: HTMLElement | undefined | null
}>()

const position = useDefaultableModel(model, "position", 0, () => ({ position: 0, color: "#FFFFFF" }))

const emit = defineEmits(["released"])

const gradientDrag = useTemplateRef("gradientDrag")

const dragOffset = ref<DOMPos>({ x: 0, y: 0 })
const dragging = ref(false)

const dragStartPos = ref<DOMPos>({ x: 0, y: 0 })
const dragStartValue = ref(0)

const containerSize = useElementSize(() => props.container)

const mouseTime = ref(0)

const overlayVisible = ref(false)

function show() {
	if (!overlayVisible.value) {
		overlayVisible.value = true
	}
}
function hide() {
	overlayVisible.value = false
}
const stopPropagation = usePropagationStop()
const stopImmediatePropagation = usePropagationImmediateStop()

function toggle(ev: MouseEvent) {
	if (ev.button != 0) return

	stopImmediatePropagation(ev)

	if (overlayVisible.value) {
		hide()
	} else {
		show()
	}
}

function onMouseDown(ev: MouseEvent) {
	if (ev.button != 0) return
	if (!gradientDrag.value) return
	if (!props.container) return

	mouseTime.value = Date.now()

	dragging.value = true
	dragOffset.value = getInternalMousePos(gradientDrag.value, ev)

	const startPos = getInternalMousePos(props.container, ev)
	startPos.x -= dragOffset.value.x
	startPos.y -= dragOffset.value.y

	dragStartPos.value = startPos
	dragStartValue.value = position.value

	ev.preventDefault()
	stopPropagation(ev)
}

function calcNewValue(ev: ClientPosition) {
	if (!gradientDrag.value) return
	if (!props.container) return

	const newPos = getInternalMousePos(props.container, ev)
	newPos.x -= dragOffset.value.x
	newPos.y -= dragOffset.value.y

	const diff = (newPos.x - dragStartPos.value.x) / containerSize.width.value
	position.value = Math.max(0, Math.min(dragStartValue.value + diff, 1))

	//position.value = Math.max(0, Math.min(newPos.x / containerSize.width.value, 1))
}

function onClick(ev: MouseEvent) {
	const now = Date.now()

	const delta = now - mouseTime.value

	if (delta > 500) return

	toggle(ev)
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
.gradient-drag {
	position: absolute;
	left: calc(v-bind(position) * 100% - var(--gradient-edit-height) * 0.125);

	border: 1px solid var(--p-inputtext-border-color);
	border-radius: var(--border-radius);

	background-color: v-bind("model?.color ?? 'white'");
	display: flex;
	width: calc(var(--gradient-edit-height) * 0.25);
	height: var(--gradient-edit-height);
}
</style>
