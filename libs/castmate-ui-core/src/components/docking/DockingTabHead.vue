<template>
	<div
		class="docked-tab-head"
		:class="{ selected, unselected: !selected, dragHover }"
		ref="tabHead"
		@mousedown="TabMouseDown"
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

		<div class="spacer"></div>

		<div class="dirty-dot" v-if="document?.dirty && isOutside"></div>
		<p-button
			icon="mdi mdi-close"
			text
			aria-label="Close"
			@click="close"
			size="small"
			class="tiny-button"
			:style="{ color: buttonColor }"
			v-if="!isOutside || (selected && !document?.dirty)"
		></p-button>
		<div class="button-placeholder" v-if="isOutside && !selected && !document?.dirty">
			<div style="width: 14px; height: 14px" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import {
	useSelectTab,
	type DockedFrame,
	type DockedTab,
	useInsertToFrame,
	useDockingArea,
	useCloseTab,
} from "../../util/docking"
import { useDocument } from "../../util/document"

import PButton from "primevue/button"
import { useMouseInElement } from "@vueuse/core"

const props = defineProps<{
	frame: DockedFrame
	id: string
	title?: string
	documentId?: string
}>()

const document = useDocument(props.documentId)
const selected = computed(() => props.frame.currentTab == props.id)
const dragging = ref<boolean>(false)

const buttonColor = computed(() => {
	if (!selected.value) {
		return "#9e9e9e"
	} else {
		if (document.value?.dirty) {
			return "white"
		}
		return undefined
	}
})

const insertToFrame = useInsertToFrame()

const dockingArea = useDockingArea()
const tabHead = ref<HTMLElement | null>(null)

const { isOutside } = useMouseInElement(tabHead)

const closeTab = useCloseTab()

function close(ev: MouseEvent) {
	closeTab(props.id)
	ev.stopPropagation()
	ev.preventDefault()
}

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

function onClicked(ev: MouseEvent) {
	if (ev.button == 0) {
		selectTab(props.id)
	}
}

function TabMouseDown(ev: MouseEvent) {
	if (ev.button == 1) {
		closeTab(props.id)
	}
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
	white-space: nowrap;
	flex-shrink: 0;
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

.spacer {
	flex: 1;
}

.dirty-dot {
	width: 10px;
	height: 10px;
	border-radius: 100px;
	background-color: white;
	margin-right: 0.5rem;
}

.docked-tab-head .tiny-button {
	padding: 0.4375rem;
	width: unset;
}

.button-placeholder {
	padding: calc(0.4375rem + 2px);
}
</style>
