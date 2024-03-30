<template>
	<div :style="positioningStyle" ref="frame">
		<div class="internalScaling" :style="{ zoom: scale }" @mousedown="onWidgetMouseDown">
			<slot></slot>
		</div>
	</div>
	<div
		:style="positioningStyle"
		:class="{ 'show-drag': showDrag, 'hidden-drag': !showDrag }"
		class="drag-div"
		@mousedown="onWidgetMouseDown"
		@contextmenu="emit('contextmenu', $event)"
	>
		<template v-if="showDrag && canScale">
			<div
				v-for="handle in dragHandles"
				:key="handle.id"
				:class="['handle', handle.class]"
				@mousedown="onHandleMouseDown($event, handle)"
				@click="stopPropagation"
			></div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { CSSProperties, computed, ref, useModel } from "vue"
import { stopPropagation, usePanQuery, usePanState } from "../../main"
import { useEventListener } from "@vueuse/core"

const props = withDefaults(
	defineProps<{
		size: { width: number; height: number }
		position: { x: number; y: number }
		color?: string
		showDrag?: boolean
		canScale?: boolean
		scaleSize: number
		aspectRatio?: number
	}>(),
	{
		color: "#FF0000",
		showDrag: false,
		canScale: true,
	}
)

const emit = defineEmits(["contextmenu"])

const size = useModel(props, "size")
const position = useModel(props, "position")

const frame = ref<HTMLElement>()

const panState = usePanState()
const panQuery = usePanQuery()

defineExpose({
	frame,
})

interface DragHandle {
	id: string
	class: string
	hx: number
	hy: number
}

const dragHandles: DragHandle[] = [
	{ id: "tl", class: "handle-tl", hx: 0, hy: 0 },
	{ id: "t", class: "handle-t", hx: 0.5, hy: 0 },
	{ id: "tr", class: "handle-tr", hx: 1, hy: 0 },
	{ id: "l", class: "handle-l", hx: 0, hy: 0.5 },
	{ id: "r", class: "handle-r", hx: 1, hy: 0.5 },
	{ id: "bl", class: "handle-bl", hx: 0, hy: 1 },
	{ id: "b", class: "handle-b", hx: 0.5, hy: 1 },
	{ id: "br", class: "handle-br", hx: 1, hy: 1 },
]

const scale = computed<number>(() => {
	//Assume zoomX and zoomY are the same
	return panState.value.zoomX * props.scaleSize
})
const positioningStyle = computed<CSSProperties>(() => ({
	position: "absolute",
	left: `${position.value.x * scale.value}px`,
	top: `${position.value.y * scale.value}px`,
	width: `${size.value.width * scale.value}px`,
	height: `${size.value.height * scale.value}px`,
}))

const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const grabbedHandle = ref<string>()

function onWidgetMouseDown(ev: MouseEvent) {
	if (ev.button != 0) return
	if (!props.showDrag) return

	const panRect = panQuery.getPanClientRect()

	//Mouse position in scale space
	const mx = (ev.clientX - panRect.left) / scale.value
	const my = (ev.clientY - panRect.top) / scale.value

	dragOffsetX.value = position.value.x - mx
	dragOffsetY.value = position.value.y - my

	grabbedHandle.value = "middle"

	ev.stopPropagation()
	ev.preventDefault()
}

function onHandleMouseDown(ev: MouseEvent, handle: DragHandle) {
	if (ev.button != 0) return
	if (!frame.value) return
	if (!props.showDrag) return

	const panRect = panQuery.getPanClientRect()

	//Mouse position in scale space
	const mx = (ev.clientX - panRect.left) / scale.value
	const my = (ev.clientY - panRect.top) / scale.value

	const frameRect = frame.value.getBoundingClientRect()

	//Handle position in scale space
	const hx = (frameRect.left - panRect.left + frameRect.width * handle.hx) / scale.value
	const hy = (frameRect.top - panRect.top + frameRect.height * handle.hy) / scale.value

	dragOffsetX.value = hx - mx
	dragOffsetY.value = hy - my

	grabbedHandle.value = handle.id

	ev.preventDefault()
	ev.stopPropagation()
}

function stopNextClick() {
	window.addEventListener(
		"click",
		(ev) => {
			ev.stopPropagation()
			ev.preventDefault()
		},
		{ once: true, capture: true }
	)
}

interface Edges {
	left: number
	right: number
	top: number
	bottom: number
}

function getEdges(): Edges {
	return {
		left: position.value.x,
		right: position.value.x + size.value.width,
		top: position.value.y,
		bottom: position.value.y + size.value.height,
	}
}

function setEdges(edges: Edges) {
	position.value.x = edges.left
	position.value.y = edges.top

	size.value.width = edges.right - edges.left
	size.value.height = edges.bottom - edges.top
}

function snapEdgesToInt(edges: Edges) {
	edges.left = Math.round(edges.left)
	edges.right = Math.round(edges.right)
	edges.top = Math.round(edges.top)
	edges.bottom = Math.round(edges.bottom)
}

function enforceAspectRatio(edges: Edges, handle: DragHandle) {
	if (!props.aspectRatio) return

	let width = edges.right - edges.left
	let height = edges.bottom - edges.top

	const newWidth = height * props.aspectRatio
	const newHeight = width / props.aspectRatio

	if (handle.id.length > 1) {
		//Choose whichever new rectangle's area is the least.
		const wA = width * newHeight
		const hA = height * newWidth
		if (wA < hA) {
			width = newWidth
		} else {
			height = newHeight
		}
	} else {
		//We're grabbing a side.
		if (handle.id == "l" || handle.id == "r") {
			height = newHeight
		} else {
			width = newWidth
		}
	}

	if (handle.id.includes("l")) {
		//Move the left side instead of the right
		edges.left = edges.right - width
	} else {
		edges.right = edges.left + width
	}

	if (handle.id.includes("t")) {
		//Move the top instead of the bottom
		edges.top = edges.bottom - height
	} else {
		edges.bottom = edges.top + height
	}
}

useEventListener("mouseup", (ev) => {
	if (!grabbedHandle.value) return
	if (ev.button != 0) return

	grabbedHandle.value = undefined

	ev.preventDefault()
	ev.stopImmediatePropagation()

	stopNextClick()
})

useEventListener(
	() => (grabbedHandle.value != null ? window : undefined),
	"mousemove",
	(ev: MouseEvent) => {
		const panRect = panQuery.getPanClientRect()

		//Mouse position in scale space
		const mx = (ev.clientX - panRect.left) / scale.value
		const my = (ev.clientY - panRect.top) / scale.value

		const targetX = mx + dragOffsetX.value
		const targetY = my + dragOffsetY.value

		const handle = dragHandles.find((h) => h.id == grabbedHandle.value)

		if (handle) {
			const edges = getEdges()
			if (handle.id.includes("l")) {
				//Moving left handle
				edges.left = targetX
			} else if (handle.id.includes("r")) {
				//Moving right handle
				edges.right = targetX
			}

			if (handle.id.includes("t")) {
				//Moving the top handle
				edges.top = targetY
			} else if (handle.id.includes("b")) {
				edges.bottom = targetY
			}
			if (props.aspectRatio) {
				enforceAspectRatio(edges, handle)
			}
			snapEdgesToInt(edges)
			setEdges(edges)
		} else if (grabbedHandle.value == "middle") {
			position.value.x = Math.round(targetX)
			position.value.y = Math.round(targetY)
		}
	}
)
</script>

<style scoped>
.show-drag {
	border-style: dashed;
	border-width: 1px;
	border-color: red;
	cursor: move;
	z-index: 2 !important;
}

.drag-div {
	z-index: 1;
}

.hidden-drag {
	border: dashed 1px transparent;
}
.internalScaling {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
}

.handle {
	--handleSize: 3px;
	width: calc(var(--handleSize) * 2);
	height: calc(var(--handleSize) * 2);
	background-color: red;
	position: absolute;
}

.handle-tl {
	cursor: nw-resize;
	top: calc(var(--handleSize) * -1);
	left: calc(var(--handleSize) * -1);
}
.handle-t {
	cursor: n-resize;
	top: calc(var(--handleSize) * -1);
	left: calc(50% - var(--handleSize));
}
.handle-tr {
	cursor: ne-resize;
	top: calc(var(--handleSize) * -1);
	right: calc(var(--handleSize) * -1);
}
.handle-l {
	cursor: w-resize;
	top: calc(50% - var(--handleSize));
	left: calc(var(--handleSize) * -1);
}
.handle-r {
	cursor: e-resize;
	top: calc(50% - var(--handleSize));
	right: calc(var(--handleSize) * -1);
}
.handle-bl {
	cursor: sw-resize;
	bottom: calc(var(--handleSize) * -1);
	left: calc(var(--handleSize) * -1);
}
.handle-b {
	cursor: s-resize;
	bottom: calc(var(--handleSize) * -1);
	left: calc(50% - var(--handleSize));
}
.handle-br {
	cursor: se-resize;
	bottom: calc(var(--handleSize) * -1);
	right: calc(var(--handleSize) * -1);
}
</style>
