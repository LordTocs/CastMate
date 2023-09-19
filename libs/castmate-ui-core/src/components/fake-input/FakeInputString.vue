<template>
	<span
		v-for="(c, i) in text"
		:class="{ selected: i >= localSelStart && i < localSelEnd }"
		@click="onSelect(i, $event)"
		:id="String(i + offset)"
		ref="charSpans"
		><fake-cursor v-if="i === localCursorIndex" />{{ c }}</span
	><fake-cursor v-if="text.length === localCursorIndex" />
	<span v-if="postfix && text.length > 0" @click="onSelect(text.length, $event)">{{ postfix }}</span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useModel, watch } from "vue"
import FakeCursor from "./FakeCursor.vue"
import { InputSelection, PartialSelectionResult } from "./FakeInputTypes"
import { getElementRelativeRect, rectangleOverlaps } from "../../main"

const props = defineProps<{
	text: string
	offset: number
	selection: InputSelection
	focused: boolean
	postfix?: string
	last?: boolean
	placeholder?: string
	dragRect: DOMRect | null
	partialSelect: PartialSelectionResult | null
	selectionContainer: HTMLElement | null
}>()

const emit = defineEmits(["selectChar", "update:partialSelect"])
const partialSelect = useModel(props, "partialSelect")

const startIndex = computed(() => props.offset)
//Include one past the end if we're the last string in the pipeline
const lastIndex = computed(() => (props.last ? props.offset + props.text.length + 1 : props.offset + props.text.length))

const selectionOverlaps = computed(() => {
	if (props.selection.start == null || props.selection.end == null) return false
	if (props.selection.start < lastIndex.value && props.selection.end >= startIndex.value) return true
	return false
})

const localSelStart = computed(() => (props.selection.start ?? 0) - props.offset)
const localSelEnd = computed(() => (props.selection.end ?? 0) - props.offset)
const localCursorIndex = computed(() => {
	if (props.selection.start == null || props.selection.end == null || props.selection.direction == null) return null
	if (!selectionOverlaps.value) return null
	if (props.selection.start != props.selection.end) return null
	if (props.selection.direction == "backward" || props.selection.direction == "none") {
		return localSelStart.value
	}
	return localSelEnd.value
})

function onSelect(index: number, ev: MouseEvent) {
	emit("selectChar", index + props.offset)
	ev.preventDefault()
	ev.stopPropagation()
}

const charSpans = ref<HTMLElement[]>([])

function updatePartialSelect() {
	if (props.dragRect == null) return
	if (!props.selectionContainer) return

	let min = Number.MAX_SAFE_INTEGER
	let max = Number.MIN_SAFE_INTEGER

	for (const char of charSpans.value) {
		const idx = Number(char.id)
		const elemRect = getElementRelativeRect(char, props.selectionContainer)
		if (rectangleOverlaps(elemRect, props.dragRect)) {
			//This char should be selected
			if (idx > max) max = idx
			if (idx < min) min = idx
		}
	}

	if (min <= max) {
		partialSelect.value = {
			start: min,
			end: max,
		}
	} else {
		partialSelect.value = null
	}
}

onMounted(() => {
	updatePartialSelect()
})

watch(
	() => props.dragRect,
	() => {
		updatePartialSelect()
	},
	{ deep: true }
)
</script>

<style scoped>
.selected {
	background-color: #0539a3;
}
</style>
