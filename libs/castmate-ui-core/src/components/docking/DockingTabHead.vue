<template>
	<div
		class="docked-tab-head"
		:class="{ selected, unselected: !selected, dragHover, focused: frameFocused }"
		ref="tabHead"
		@mousedown="tabMouseDown"
		@click="onClicked"
		draggable="true"
		@dragstart="dragStart"
	>
		<template v-if="typeof tab.icon == 'string'">
			<i :class="tab.icon" class="pr-1" />
		</template>
		<component v-else-if="tab.icon" :is="tab.icon" class="pr-1" />

		{{ tab.title }}

		<div class="spacer"></div>

		<div class="button-placeholder" v-if="isDirty && isOutside">
			<div class="dirty-dot"></div>
		</div>
		<p-button
			icon="mdi mdi-close"
			text
			aria-label="Close"
			@click="close"
			size="small"
			class="tiny-button"
			:style="{ color: buttonColor }"
			v-if="!isOutside || (selected && !isDirty)"
		></p-button>
		<div class="button-placeholder" v-if="isOutside && !selected && !isDirty">
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
	useTabFrame,
} from "../../util/docking"
import { useDocument } from "../../util/document"

import PButton from "primevue/button"
import { useMouseInElement } from "@vueuse/core"
import { useDragEnd, useDragEnter, useDragLeave, useDragOver, useDrop } from "../../main"

const props = defineProps<{
	frame: DockedFrame
	tab: DockedTab
}>()

const selected = computed(() => props.frame.currentTab == props.tab.id)
const dragging = ref<boolean>(false)

interface DirtyData {
	dirty?: boolean
}

const isDirty = computed(() => (props.tab?.pageData as DirtyData | undefined)?.dirty == true)

const buttonColor = computed(() => {
	if (!selected.value) {
		return "#9e9e9e"
	} else {
		if (isDirty.value) {
			return "white"
		}
		return undefined
	}
})

const insertToFrame = useInsertToFrame()

const dockingArea = useDockingArea()
const tabFrame = useTabFrame()
const tabHead = ref<HTMLElement | null>(null)

const frameFocused = computed(() => {
	return dockingArea.value.focusedFrame == tabFrame.value.id
})

const { isOutside } = useMouseInElement(tabHead)

const closeTab = useCloseTab()

function close(ev: MouseEvent) {
	closeTab(props.tab.id)
	ev.stopPropagation()
	ev.preventDefault()
}

function dragStart(evt: DragEvent) {
	if (!evt.dataTransfer) {
		return
	}
	evt.dataTransfer.effectAllowed = "move"
	evt.dataTransfer.setData("tab-id", props.tab.id)
	dragging.value = true
	dockingArea.value.dragging = true
}

useDragEnd(tabHead, (ev) => {
	dragging.value = false
	dockingArea.value.dragging = false
})

const dragHover = ref<boolean>(false)

useDragEnter(tabHead, "tab-id", (ev) => {
	dragHover.value = true
})

useDragLeave(tabHead, "tab-id", (ev) => {
	dragHover.value = false
})

useDragOver(tabHead, "tab-id", (ev) => {
	ev.dataTransfer.dropEffect = "move"
})

useDrop(tabHead, "tab-id", (ev) => {
	dragHover.value = false
	if (!tabHead.value) throw new Error("Shouldn't get here???")

	const tabId = ev.dataTransfer.getData("tab-id")
	if (tabId != props.tab.id) {
		const buttonRect = tabHead.value.getBoundingClientRect()
		const internalX = ev.clientX - buttonRect.left
		const percentX = internalX / buttonRect.width

		insertToFrame(tabId, props.tab.id, percentX < 0.5 ? "left" : "right")
	}
	dockingArea.value.dragging = false
})

const selectTab = useSelectTab()

function onClicked(ev: MouseEvent) {
	if (ev.button == 0) {
		selectTab(props.tab.id)
	}
}

function tabMouseDown(ev: MouseEvent) {
	if (ev.button == 1) {
		closeTab(props.tab.id)
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

.selected.focused {
	border-top: 2px solid var(--p-primary-color);
	border-bottom: none;
	background-color: var(--surface-d);
}

.selected {
	border-top: 2px solid var(--surface-border);
	border-bottom: none;
	background-color: var(--surface-d);
}

.dragHover {
	background-color: var(--p-surface-600);
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
	margin: 2px 1px;
}

.docked-tab-head .tiny-button {
	padding: 0.4375rem;
	width: unset;
}

.button-placeholder {
	padding: calc(0.4375rem + 2px);
}
</style>
