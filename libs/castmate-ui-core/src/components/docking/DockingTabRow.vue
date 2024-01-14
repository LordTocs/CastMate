<template>
	<div class="docking-tab-row" @drop="onDropped" @dragover="onDragOver" @dragenter="dragEnter" @dragleave="dragLeave">
		<div class="docking-tab-row-inner" @mousewheel="onScroll" ref="inner" :class="{ dragHover }">
			<docking-tab-head
				v-for="tab in modelObj.tabs"
				:key="tab.id"
				:document-id="tab.documentId"
				:title="tab.title"
				:frame="modelObj"
				:id="tab.id"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import DockingTabHead from "./DockingTabHead.vue"
import { type DockedFrame, useMoveToFrame } from "../../util/docking"
import { useVModel } from "@vueuse/core"
import { ref } from "vue"

const props = defineProps<{
	modelValue: DockedFrame
}>()

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)

const moveToFrame = useMoveToFrame()

const inner = ref<HTMLElement>()

function onDropped(evt: DragEvent) {
	if (!evt.dataTransfer) {
		return
	}

	//A tab was dropped on top of this tab, move it to infront of it.

	console.log("Row Drop")
	dragHover.value = false
	const tabId = evt.dataTransfer.getData("tab-id")

	moveToFrame(tabId)

	console.log("Dropped", tabId)

	evt.preventDefault()
	evt.stopPropagation()
}

const dragHover = ref<boolean>(false)
function dragEnter(evt: DragEvent) {
	if (evt.dataTransfer?.types.includes("tab-id")) {
		dragHover.value = true
		evt.preventDefault()
		evt.stopPropagation()
	}
}

function dragLeave(evt: DragEvent) {
	if (evt.dataTransfer?.types.includes("tab-id")) {
		dragHover.value = false
		evt.preventDefault()
		evt.stopPropagation()
	}
}

function onDragOver(evt: DragEvent) {
	if (evt.dataTransfer?.types.includes("tab-id")) {
		evt.dataTransfer.dropEffect = "move"
		evt.preventDefault()
		evt.stopPropagation()
	}
}

function onScroll(ev: WheelEvent) {
	if (!inner.value) return

	inner.value.scrollLeft += ev.deltaY * 0.75
	ev.preventDefault()
}
</script>

<style scoped>
.docking-tab-row {
	position: relative;
	height: 2.5rem;
	width: 100%;
}

.docking-tab-row-inner {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;

	display: flex;
	flex-direction: row;
	overflow-y: hidden;
	overflow-x: auto;
	background-color: var(--surface-b);
}

.docking-tab-row-inner::-webkit-scrollbar {
	display: none;
}

.dragHover {
	background-color: var(--surface-400);
}
</style>
