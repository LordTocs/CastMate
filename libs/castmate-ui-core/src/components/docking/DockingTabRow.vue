<template>
	<div
		class="docking-tab-row"
		:class="{ dragHover }"
		@drop="onDropped"
		@dragover="onDragOver"
		@dragenter="dragEnter"
		@dragleave="dragLeave"
	>
		<docking-tab-head
			v-for="tab in modelObj.tabs"
			:key="tab.id"
			:document-id="tab.documentId"
			:frame="modelObj"
			:id="tab.id"
		/>
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
</script>

<style scoped>
.docking-tab-row {
	position: relative;
	display: flex;
	flex-direction: row;
	height: 2.5rem;
	overflow-y: hidden;
	overflow-x: auto;
	width: 100%;
	background-color: var(--surface-b);
}

.dragHover {
	background-color: var(--surface-400);
}
</style>
