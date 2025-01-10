<template>
	<div
		class="drag-overlay"
		ref="dragOverlay"
		v-if="dockingArea.dragging"
		@dragover="dragOver"
		@dragenter="dragEnter"
		@dragleave="dragLeave"
		@drop="onDropped"
	></div>
	<div class="drag-indicator" :class="{ [`drop-${dropMode}`]: true }" v-if="dragHover"></div>
</template>

<script setup lang="ts">
import { ref, unref } from "vue"
import { DropMode, useDockingArea, useMoveToFrame, useTabFrame } from "../../main"
import { useElementBounding } from "@vueuse/core"

const dragOverlay = ref<HTMLElement | null>(null)
const dragBounds = useElementBounding(dragOverlay)

const dockingArea = useDockingArea()
const dragHover = ref<boolean>(false)
const dropMode = ref<DropMode>("all")

const moveToFrame = useMoveToFrame()

const tabFrame = useTabFrame()

function dragEnter(evt: DragEvent) {
	if (evt.dataTransfer?.types.includes("tab-id")) {
		dragHover.value = true
		evt.preventDefault()
		evt.stopPropagation()
	}
}

function isOnlyTab(tabId: string) {
	if (tabFrame.value.tabs.length > 1) {
		return false
	}
	if (tabFrame.value.tabs[0]?.id == tabId) {
		return true
	}
	return false
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
		const px = (evt.clientX - unref(dragBounds.left)) / unref(dragBounds.width)
		const py = (evt.clientY - unref(dragBounds.top)) / unref(dragBounds.height)

		if (px < 0.15) {
			dropMode.value = "left"
		} else if (px > 0.85) {
			dropMode.value = "right"
		} else {
			if (py < 0.15) {
				dropMode.value = "top"
			} else if (py > 0.85) {
				dropMode.value = "bottom"
			} else {
				dropMode.value = "all"
			}
		}

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
	if (tabId && !isOnlyTab(tabId)) {
		moveToFrame(tabId, dropMode.value)
	}
	dockingArea.value.dragging = false
	evt.preventDefault()
	evt.stopPropagation()
}
</script>

<style scoped>
.drag-overlay {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 5;
}

.drag-indicator {
	position: absolute;
	background-color: rgba(255, 255, 255, 0.5);
	pointer-events: none;
	user-select: none;
	z-index: 4;
}

.drop-all {
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
}

.drop-left {
	left: 0;
	right: 50%;
	top: 0;
	bottom: 0;
}

.drop-right {
	left: 50%;
	right: 0;
	top: 0;
	bottom: 0;
}

.drop-top {
	left: 0;
	right: 0;
	top: 0;
	bottom: 50%;
}

.drop-bottom {
	left: 0;
	right: 0;
	top: 50%;
	bottom: 0;
}
</style>
