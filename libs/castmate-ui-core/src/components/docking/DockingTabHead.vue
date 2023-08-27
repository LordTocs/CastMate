<template>
	<div
		class="docked-tab-head"
		:class="{ selected, unselected: !selected, dragHover }"
		ref="tabHead"
		@click="onClicked"
		draggable="true"
		@dragstart="dragStart"
		@dragend="dragEnd"
		@dragenter="dragEnter"
		@dragleave="dragLeave"
		@dragover="dragOver"
		@drop="onDropped"
	>
		{{ document?.data?.name ?? props.title }}
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useSelectTab, type DockedFrame, type DockedTab, useInsertToFrame, useDockingArea } from "../../util/docking"
import { useDocument } from "../../util/document"

const props = defineProps<{
	frame: DockedFrame
	id: string
	title?: string
	documentId?: string
}>()

const document = useDocument(props.documentId)
const selected = computed(() => props.frame.currentTab == props.id)
const dragging = ref<boolean>(false)

const insertToFrame = useInsertToFrame()

const dockingArea = useDockingArea()
const tabHead = ref<HTMLElement | null>(null)

function dragStart(evt: DragEvent) {
	if (!evt.dataTransfer) {
		return
	}
	evt.dataTransfer.effectAllowed = "move"
	evt.dataTransfer.setData("tab-id", props.id)
	dragging.value = true
	dockingArea.dragging = true
}

function dragEnd(evt: DragEvent) {
	evt.preventDefault()
	console.log("dragEnd", props.id)
	dragging.value = false
	dockingArea.dragging = false
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

function dragOver(evt: DragEvent) {
	if (evt.dataTransfer?.types.includes("tab-id")) {
		evt.dataTransfer.dropEffect = "move"
		evt.preventDefault()
		evt.stopPropagation()
	}
}

function onDropped(evt: DragEvent) {
	if (!evt.dataTransfer) {
		return
	}

	//A tab was dropped on top of this tab, move it to infront of it.
	dragHover.value = false
	const tabId = evt.dataTransfer.getData("tab-id")
	if (tabId != props.id && tabHead.value) {
		const px = (evt.clientX - tabHead.value.clientLeft) / tabHead.value.clientWidth
		console.log("Dropped", tabId, px, evt.clientX, tabHead.value.clientLeft, tabHead.value.clientWidth)

		insertToFrame(tabId, props.id, px < 0.5 ? "left" : "right")
	}
	evt.preventDefault()
	evt.stopPropagation()
}

const selectTab = useSelectTab()

function onClicked(evt: MouseEvent) {
	selectTab(props.id)
}
</script>

<style scoped>
.docked-tab-head {
	height: 100%;
	background-color: var(--surface-b);
	color: var(--text-color);
	min-width: 10rem;
	display: flex;
	flex-direction: row;
	align-items: center;
	padding-left: 1rem;
	border: 1px solid var(--surface-border);
}

.selected {
	border-top: 2px solid var(--primary-color);
	border-bottom: none;
	background-color: var(--surface-d);
}

.dragHover {
	background-color: var(--surface-400);
}

.unselected {
	border-bottom: 2px solid var(--surface-border);
}
</style>
