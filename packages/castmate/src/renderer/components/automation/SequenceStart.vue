<template>
	<div class="sequence-start" :class="{ 'is-selected': isSelected }" ref="sequenceStartElem">
		<p-button @click="onButtonClick" @mousedown="onMouseDown">
			<i class="mdi mdi-play" v-if="!activeTestSequence"></i>
			<i class="mdi mdi-pause" v-else></i>
		</p-button>
	</div>
</template>

<script setup lang="ts">
import {
	type SelectionPos,
	type Selection,
	getElementRelativeRect,
	rectangleOverlaps,
	useIsSelected,
	useDocumentPath,
	useParentTestSequence,
} from "castmate-ui-core"
import { ref } from "vue"
import PButton from "primevue/button"

const sequenceStartElem = ref<HTMLElement | null>(null)

const isSelected = useIsSelected(useDocumentPath(), "trigger")

const emit = defineEmits(["requestTestRun", "requestTestStop"])

const activeTestSequence = useParentTestSequence()

function onButtonClick(ev: MouseEvent) {
	if (activeTestSequence.value) {
		emit("requestTestStop")
	} else {
		emit("requestTestRun")
	}
	ev.stopPropagation()
	ev.preventDefault()
}

defineExpose({
	getSelectedItems(container: HTMLElement, from: SelectionPos, to: SelectionPos): Selection {
		if (!sequenceStartElem.value) return []

		const rect = getElementRelativeRect(sequenceStartElem.value, container)
		const selrect = new DOMRect(from.x, from.y, to.x - from.x, to.y - from.y)
		return rectangleOverlaps(rect, selrect) ? ["trigger"] : []
	},
})

function onMouseDown(ev: MouseEvent) {
	ev.stopPropagation()
}
</script>

<style scoped>
.sequence-start {
	position: relative;

	border-radius: var(--border-radius);
	background-color: var(--darker-trigger-color);
	border: solid 2px var(--lighter-trigger-color);
	color: var(--trigger-color);

	height: var(--timeline-height);
	width: var(--instant-width);

	font-size: calc(var(--timeline-height) * 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
}

.is-selected {
	border-color: white;
}
</style>
