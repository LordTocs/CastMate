<template>
	<div class="sequence-start-container flex flex-row">
		<div class="sequence-start" :class="{ 'is-selected': isSelected }" ref="sequenceStartElem">
			<div class="sequence-start-header">
				<i class="flex-none" :class="trigger?.icon" />
				{{ trigger?.name }}
			</div>
			<div class="flex-grow-1"></div>
			<div class="test-button" @click="onButtonClick" @mousedown="stopPropagation">
				<i class="mdi mdi-play" v-if="!activeTestSequence"></i>
				<i class="mdi mdi-stop" v-else></i>
				Test
			</div>
		</div>
		<slot></slot>
	</div>
</template>

<script setup lang="ts">
import {
	type SelectionPos,
	type Selection,
	getElementRelativeRect,
	rectangleOverlaps,
	useIsSelected,
	useParentTestSequence,
	TriggerSelection,
	useTrigger,
	usePropagationStop,
} from "../../main"
import { ComputedRef, computed, inject, ref } from "vue"
import PButton from "primevue/button"

const stopPropagation = usePropagationStop()

const sequenceStartElem = ref<HTMLElement | null>(null)

const isSelected = useIsSelected("trigger")

const emit = defineEmits(["requestTestRun", "requestTestStop"])

const activeTestSequence = useParentTestSequence()

const triggerSelection = inject<ComputedRef<TriggerSelection>>(
	"trigger-edit-select",
	computed(() => ({}))
)

const trigger = useTrigger(triggerSelection)

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
</script>

<style scoped>
.sequence-start-container {
	position: relative;
}

.sequence-start {
	position: relative;

	border-radius: var(--border-radius);
	background-color: var(--trigger-color);
	border: solid 2px var(--lighter-trigger-color);

	height: var(--timeline-height);
	min-width: var(--instant-width);

	display: flex;
	flex-direction: column;
}

.sequence-start-header {
	background-color: var(--darker-trigger-color);
	height: 1.5rem;

	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);

	white-space: nowrap;
	padding-left: 0.1rem;
	padding-right: 0.1rem;

	transition: background-color 0.3s;
}

.is-selected {
	border-color: white;
}

.test-button {
	background-color: var(--darker-trigger-color);
	padding: 0.01rem;

	cursor: pointer;

	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;

	height: 1.5rem;
}

.test-button:hover {
	background-color: var(--darkest-trigger-color);
}
</style>
