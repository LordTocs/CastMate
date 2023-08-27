<template>
	<div class="timeline-container" :class="{ indefinite, 'has-right-handle': hasRightHandle }" :style="{ '--duration': duration }">
		<div class="time-action" ref="actionElement" :style="{ ...actionColorStyle }">
			<div class="time-action-content" :class="{ 'is-selected': isSelected }">
				<div class="time-action-header action-handle">
					<!-- <i class="mdi flex-none" :class="action?.icon" /> -->
					<!-- {{ action?.name }} -->
				</div>
				<div class="time-action-custom"></div>
				<text-hider class="time-action-footer">
					{{ duration.toFixed(2) }}
				</text-hider>
			</div>
			<duration-handle v-model="duration" v-if="hasRightHandle" />
		</div>
		<automation-drop-zone
			:drop-key="`${modelValue.id}-bottom`"
			:key="`${modelValue.id}-bottom`"
			drop-axis="horizontal"
			drop-location="start"
			style="left: 0; top: var(--timeline-height); right: 0; height: calc(var(--timeline-height) / 2)"
			@automation-drop="onAutomationDrop"
		/>
		<div class="timeline-sequences">
			<offset-sequence-edit
				v-for="(o, i) in model.offsets"
				:key="o.id"
				v-model="model.offsets[i]"
				@self-destruct="removeOffset(i)"
				ref="offsetEdits"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, useModel, ref, provide } from "vue"
import DurationHandle from "./DurationHandle.vue"
import {
	rectangleOverlaps,
	Selection,
	SelectionPos,
	getElementRelativeRect,
	useAction,
	useActionColors,
	useDocumentPath,
	useIsSelected,
	TextHider
} from "castmate-ui-core"
import OffsetSequenceEdit from "./OffsetSequenceEdit.vue"
import AutomationDropZone from "./AutomationDropZone.vue"
import { Sequence, OffsetActions, TimeAction } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import _sortedIndexBy from "lodash/sortedIndexBy"
import { SelectionGetter } from "../../util/automation-dragdrop"
import { useDuration } from "../../util/actions"


const action = useAction(() => props.modelValue)
const { actionColorStyle } = useActionColors(() => props.modelValue)

const indefinite = computed(() => false)

const props = defineProps<{
	modelValue: TimeAction
}>()

const model = useModel(props, "modelValue")

const config = computed({
	get() {
		return model.value.config
	},
	set(v) {
		model.value.config = v
	},
})

const duration = useDuration(() => props.modelValue, config)

const actionElement = ref<HTMLElement | null>(null)
provide("actionElement", actionElement)
provide(
	"timeInfo",
	computed(() => ({
		minLength: 0,
		duration: duration.value,
		maxLength: undefined,
	}))
)

function removeOffset(index: number) {
	model.value.offsets.splice(index, 1)
}

function onAutomationDrop(sequence: Sequence, offset: { x: number; y: number; width: number; height: number }) {
	const timeOffset = (offset.x / offset.width) * duration.value

	const offsetSequence: OffsetActions = {
		id: nanoid(),
		offset: timeOffset,
		actions: sequence.actions,
	}

	const insertionIndex = _sortedIndexBy(props.modelValue.offsets, offsetSequence, (oa) => oa.offset)

	model.value.offsets.splice(insertionIndex, 0, offsetSequence)
}

const hasRightHandle = computed(() => true)

const isSelected = useIsSelected(useDocumentPath(), () => props.modelValue.id)
const offsetEdits = ref<SelectionGetter[]>([])
defineExpose({
	getSelectedItems(container: HTMLElement, from: SelectionPos, to: SelectionPos): Selection {
		if (!actionElement.value) return []

		const result: string[] = []

		for (const oe of offsetEdits.value) {
			result.push(...oe.getSelectedItems(container, from, to))
		}

		const rect = getElementRelativeRect(actionElement.value, container)
		const selrect = new DOMRect(from.x, from.y, to.x - from.x, to.y - from.y)

		if (rectangleOverlaps(rect, selrect)) {
			result.push(props.modelValue.id)
		}

		return result
	},
})
</script>

<style scoped>
.timeline-container {
	position: relative;
	--time-action-width: calc(var(--duration) * var(--time-width));
	/* width: var(--time-action-width); */
}

.time-action {
	display: flex;
	flex-direction: row;
	position: relative;
	pointer-events: auto;

	width: var(--time-action-width);
	height: var(--timeline-height);
}
.time-action-content {
	/* border-radius: var(--border-radius); */
	background-color: var(--action-color);
	border-radius: var(--border-radius) 0 0 var(--border-radius);
	border-top: solid 2px var(--lighter-action-color);
	border-bottom: solid 2px var(--lighter-action-color);
	border-left: solid 2px var(--lighter-action-color);

	flex-grow: 1;
	flex-shrink: 1;
	display: flex;
	flex-direction: column;

	/* width: var(--time-action-width); */
}

.time-action-content.has-right-handle {
	width: calc(var(--time-action-width) - 8px)
}

.time-action-header {
	background-color: var(--darker-action-color);
	height: 1.5rem;
	cursor: grab;
	overflow: hidden;
	white-space: nowrap;
	border-top-left-radius: var(--border-radius);
}



.indefinite .time-action-header {
	background: repeating-linear-gradient(
		45deg,
		var(--darker-action-color),
		var(--darker-action-color) 10px,
		var(--darkest-action-color) 10px,
		var(--darkest-action-color) 20px
	) !important;
}

.time-action-custom {
	flex: 1;
}

.time-action-footer {
	/* height: 1.5rem; */
	text-align: center;
	background-color: var(--darker-action-color);
	/* overflow: hidden; */
	/* white-space: nowrap; */
}

.timeline-sequences {
	width: 100%;
	position: relative;
}

.is-selected {
	border-top-color: white !important;
	border-bottom-color: white !important;
	border-left-color: white !important;
}
</style>
