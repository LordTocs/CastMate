<template>
	<div
		class="timeline-container"
		:class="{ indefinite, 'has-right-handle': hasRightSlider }"
		:style="{ '--duration': length, '--offset-height': `${maxOffsetSize}px` }"
	>
		<div
			class="time-action"
			:style="{ ...actionColorStyle }"
			:class="{ 'is-selected': isSelected, 'is-testing': testTime != null }"
			ref="timeActionContainer"
		>
			<duration-handle
				v-model="leftDurationValue"
				v-if="hasLeftSlider"
				:min="leftSliderConfig?.min"
				:max="leftSliderConfig?.max"
				:left="true"
				:other-value="leftReferenceDuration"
				@interacted="onDurationInteraction"
			/>
			<div class="time-action-content" ref="actionElement">
				<div class="time-action-header action-handle">
					<i class="mdi flex-none" :class="action?.icon" />
					{{ action?.name }}
				</div>
				<div class="time-action-custom-wrapper">
					<component
						v-model="model.config"
						:is="action?.actionComponent ?? DefaultActionComponent"
						:plugin="model.plugin"
						:action="model.action"
						v-bind="action?.componentExtraProps"
						v-if="action?.type == 'regular'"
						class="time-action-custom"
					/>
					<div class="play-indicator" v-if="testTime != null" :style="{ '--play-time': playTime }"></div>
				</div>
				<div class="time-action-footer">
					<duration-label :model-value="length" />
				</div>
			</div>
			<duration-handle
				v-model="rightDurationValue"
				v-if="hasRightSlider"
				:min="rightSliderConfig?.min"
				:max="rightSliderConfig?.max"
				:left="false"
				:other-value="rightReferenceDuration"
				@interacted="onDurationInteraction"
			/>
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
import { computed, useModel, ref, provide, watch, inject, ComputedRef } from "vue"
import DurationHandle from "./DurationHandle.vue"
import {
	rectangleOverlaps,
	Selection,
	SelectionPos,
	getElementRelativeRect,
	useAction,
	useActionColors,
	useIsSelected,
	TextHider,
	useActionTestTime,
	DurationLabel,
	useDocumentSelection,
} from "../../main"
import OffsetSequenceEdit from "./OffsetSequenceEdit.vue"
import AutomationDropZone from "./AutomationDropZone.vue"
import { Sequence, OffsetActions, TimeAction } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import _sortedIndexBy from "lodash/sortedIndexBy"
import { SelectionGetter, useAutomationEditState } from "../../util/automation-dragdrop"
import { useDuration } from "../../util/actions"
import { getByPath, setByPath } from "castmate-schema"
import { Duration } from "castmate-schema"
import { IPCDurationState } from "castmate-schema"
import { useElementBounding } from "@vueuse/core"

import DefaultActionComponent from "./DefaultActionComponent.vue"

const action = useAction(() => props.modelValue)

const isFloating = inject<ComputedRef<boolean>>(
	"sequence-floating",
	computed(() => false)
)

const { actionColorStyle } = useActionColors(() => props.modelValue, isFloating)

const indefinite = computed(() => false)

const props = defineProps<{
	modelValue: TimeAction
	duration: IPCDurationState
}>()

const model = useModel(props, "modelValue")

const automationEditState = useAutomationEditState()

const config = computed({
	get() {
		return model.value.config
	},
	set(v) {
		model.value.config = v
	},
})

const rightSliderConfig = computed(() =>
	props.duration.dragType == "length" || props.duration.dragType == "crop" ? props.duration.rightSlider : undefined
)

const leftSliderConfig = computed(() => (props.duration.dragType == "crop" ? props.duration.leftSlider : undefined))

const hasLeftSlider = computed(() => {
	return leftSliderConfig.value != null
})

const hasRightSlider = computed(() => {
	return rightSliderConfig.value != null
})

const rightDurationValue = computed<Duration | undefined>({
	get() {
		if (props.duration.dragType == "crop" || props.duration.dragType == "length") {
			if (props.duration.rightSlider) {
				return getByPath(config.value, props.duration.rightSlider.sliderProp)
			}
		}
		return undefined
	},
	set(v) {
		if (props.duration.dragType == "crop" || props.duration.dragType == "length") {
			const sliderProp = props.duration.rightSlider?.sliderProp
			if (sliderProp) {
				setByPath(config.value, sliderProp, v)
			}
		}
	},
})
const leftDurationValue = computed<Duration | undefined>({
	get() {
		if (props.duration.dragType == "crop") {
			if (props.duration.leftSlider) {
				return getByPath(config.value, props.duration.leftSlider.sliderProp)
			}
		}
		return undefined
	},
	set(v) {
		if (props.duration.dragType == "crop") {
			const sliderProp = props.duration.leftSlider?.sliderProp
			if (sliderProp) {
				setByPath(config.value, sliderProp, v)
			}
		}
	},
})

const rightReferenceDuration = computed<number>(() => {
	if (leftDurationValue.value != null) return leftDurationValue.value
	return 0
})

const leftReferenceDuration = computed<number>(() => {
	if (rightDurationValue.value != null) return rightDurationValue.value
	if (props.duration.dragType == "crop") return props.duration.duration
	return 0
})

const length = computed<number>(() => {
	if (props.duration.dragType == "instant") {
		return 0
	} else if (props.duration.dragType == "fixed") {
		return props.duration.duration
	} else if (props.duration.dragType == "length") {
		return getByPath(config.value, props.duration.rightSlider.sliderProp)
	} else if (props.duration.dragType == "crop") {
		let leftCrop: number | undefined
		const configValue = config.value
		if (props.duration.leftSlider) {
			leftCrop = getByPath(configValue, props.duration.leftSlider.sliderProp)
		}
		let rightCrop: number | undefined
		if (props.duration.rightSlider) {
			rightCrop = getByPath(configValue, props.duration.rightSlider.sliderProp)
		}

		if (leftCrop != null && rightCrop != null) {
			return rightCrop - leftCrop
		} else if (leftCrop != null) {
			return props.duration.duration - leftCrop
		} else if (rightCrop != null) {
			return rightCrop
		} else {
			return props.duration.duration
		}
	}
})

const timeActionContainer = ref<HTMLElement | null>(null)
const actionElement = ref<HTMLElement | null>(null)
provide("actionElement", actionElement)
provide(
	"timeInfo",
	computed(() => ({
		minLength: 0,
		duration: length.value,
		maxLength: undefined,
	}))
)

function removeOffset(index: number) {
	model.value.offsets.splice(index, 1)
}

function onAutomationDrop(sequence: Sequence, offset: { x: number; y: number; width: number; height: number }) {
	const timeOffset = (offset.x / offset.width) * length.value

	const offsetSequence: OffsetActions = {
		id: nanoid(),
		offset: timeOffset,
		actions: sequence.actions,
	}

	const insertionIndex = _sortedIndexBy(props.modelValue.offsets, offsetSequence, (oa) => oa.offset)

	if (model.value.offsets) {
		model.value.offsets.splice(insertionIndex, 0, offsetSequence)
	} else {
		model.value.offsets = [offsetSequence]
	}
}

const isSelected = useIsSelected(() => props.modelValue.id)
const offsetEdits = ref<InstanceType<typeof OffsetSequenceEdit>[]>([])

const testTime = useActionTestTime(() => props.modelValue.id)
let animationStartStamp: number | null = null
const playTime = ref(0)

function animateProgress(timestamp: number) {
	if (animationStartStamp == null) {
		animationStartStamp = timestamp
	}

	const delta = timestamp - animationStartStamp
	playTime.value = delta / 1000

	if (testTime.value != null) {
		window.requestAnimationFrame(animateProgress)
	}
}

watch(testTime, (value, oldValue) => {
	if (oldValue == null && value != null) {
		//A new play has started
		playTime.value = 0
		animationStartStamp = null
		window.requestAnimationFrame(animateProgress)
	}
})

const maxOffsetSize = computed(() => {
	let max = 0
	for (const offset of offsetEdits.value) {
		const value = offset.parentRelativeBounds.bottom
		if (value > max) {
			max = value
		}
	}
	return max
})

defineExpose({
	getSelectedItems(container: HTMLElement, from: SelectionPos, to: SelectionPos): Selection {
		if (!timeActionContainer.value) return []

		const result: string[] = []

		for (const oe of offsetEdits.value) {
			result.push(...oe.getSelectedItems(container, from, to))
		}

		const rect = getElementRelativeRect(timeActionContainer.value, container)
		const selrect = new DOMRect(from.x, from.y, to.x - from.x, to.y - from.y)

		if (rectangleOverlaps(rect, selrect)) {
			result.push(props.modelValue.id)
		}

		return result
	},
	deleteIds(ids: string[]) {
		if (ids.includes(props.modelValue.id)) {
			//I'm being deleted
			//Delete children?
			for (let i = 0; i < offsetEdits.value.length; ++i) {
				const oe = offsetEdits.value[i]
				if (oe.deleteIds(ids)) {
					//Needs orphaning
					const rect = oe.$el.getBoundingClientRect()
					automationEditState?.createFloatingSequence(props.modelValue.offsets[i], {
						clientX: rect.x,
						clientY: rect.y,
					})
				}
			}
			return false
		} else {
			const removalIds: string[] = []
			for (let i = 0; i < offsetEdits.value.length; ++i) {
				const oe = offsetEdits.value[i]
				if (!oe.deleteIds(ids)) {
					//This offset needs to be removed.
					removalIds.push(props.modelValue.offsets[i].id)
				}
			}

			if (removalIds.length > 0) {
				model.value.offsets = model.value.offsets.filter((o) => !removalIds.includes(o.id))
			}
			return true
		}
	},
})

const selection = useDocumentSelection()

function onDurationInteraction() {
	selection.value = [model.value.id]
}
</script>

<style scoped>
.timeline-container {
	position: relative;
	--time-action-width: calc(var(--duration) * var(--time-width));
	/* width: var(--time-action-width); */
	height: calc(var(--timeline-height) + var(--offset-height));
}

.time-action {
	display: flex;
	flex-direction: row;
	position: relative;
	pointer-events: auto;

	border: solid 2px var(--lighter-action-color);
	border-radius: var(--border-radius);

	height: var(--timeline-height);
	overflow: hidden;

	transition: border-color 0.3s;
}
.time-action-content {
	/* border-radius: var(--border-radius); */
	/* border-radius: var(--border-radius) 0 0 var(--border-radius); */
	/* border-top: solid 2px var(--lighter-action-color); */
	/* border-bottom: solid 2px var(--lighter-action-color); */
	/* border-left: solid 2px var(--lighter-action-color); */

	display: flex;
	flex-direction: column;

	width: var(--time-action-width);
}

.time-action-content.has-right-handle {
	width: calc(var(--time-action-width) - 8px);
}

.time-action-header {
	background-color: var(--darker-action-color);
	height: 1.5rem;
	cursor: grab;
	overflow: hidden;
	white-space: nowrap;
	/* border-top-left-radius: var(--border-radius); */
	width: var(--time-action-width);
	transition: background-color 0.3s;
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

.time-action-custom-wrapper {
	flex: 1;
	background-color: var(--action-color);
	width: var(--time-action-width);
	position: relative;
	overflow-x: hidden;

	transition: background-color 0.3s;
}

.time-action-custom {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
}

.time-action-footer {
	height: 1.5rem;
	text-align: center;
	background-color: var(--darker-action-color);
	overflow: hidden;
	text-overflow: clip;
	white-space: nowrap;
	width: var(--time-action-width);

	transition: background-color 0.3s;
}

.timeline-sequences {
	width: 100%;
	position: relative;
	left: 2px;
}

.is-selected {
	border-color: white;
}

.is-testing {
	/* border-color: var(--darkest-action-color) !important; */
	transition: border-color 0s !important;
}

.is-testing .time-action-header {
	/* background-color: var(--darkest-action-color); */
	transition: background-color 0s !important;
}

.is-testing .time-action-footer {
	/* background-color: var(--darkest-action-color); */
	transition: background-color 0s !important;
}

.is-testing .time-action-custom-wrapper {
	background-color: var(--lighter-action-color);
	transition: background-color 0s !important;
}

.play-indicator {
	position: absolute;
	left: calc(var(--play-time) * var(--time-width));
	top: 0;
	width: 2px;
	height: 100%;
	background-color: white;
}
</style>
