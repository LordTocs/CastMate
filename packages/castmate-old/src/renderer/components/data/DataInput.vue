<template>
	<object-input
		v-if="schema.type == 'Object' && schema.properties"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<array-input
		v-if="schema.type == 'Array'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<number-input
		v-else-if="schema.type == 'Number'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<resource-input
		v-else-if="schema.type == 'Resource'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<string-input
		v-else-if="schema.type == 'String'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<boolean-input
		v-else-if="schema.type == 'Boolean'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<automation-selector
		v-else-if="schema.type == 'Automation'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<reward-selector
		v-else-if="schema.type == 'ChannelPointReward'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<time-input
		v-else-if="schema.type == 'Duration'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<range-input
		v-else-if="schema.type == 'Range'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<overlay-font-style-input
		v-else-if="schema.type == 'OverlayFontStyle'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<overlay-transition-input
		v-else-if="schema.type == 'OverlayTransition'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<overlay-transition-timing-input
		v-else-if="schema.type == 'OverlayTransitionTiming'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<overlay-padding-input
		v-else-if="schema.type == 'OverlayPadding'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<media-input
		v-else-if="schema.type == 'MediaFile'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<toggle-input
		v-else-if="schema.type == 'Toggle'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<color-input
		v-else-if="schema.type == 'Color'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<light-color-input
		v-else-if="schema.type == 'LightColor'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<folder-input
		v-else-if="schema.type == 'Folder'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<file-input
		v-else-if="schema.type == 'File'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<overlay-widget-input
		v-else-if="schema.type == 'OverlayWidget'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<dynamic-type-input
		v-else-if="schema.type == 'Dynamic'"
		v-model="modelObj"
		v-bind="allProps"
	/>
</template>

<script setup>
import { computed } from "vue"

import RewardSelector from "../rewards/RewardSelector.vue"
import RangeInput from "./types/RangeInput.vue"
import TimeInput from "./types/TimeInput.vue"
import StringInput from "./types/StringInput.vue"
import NumberInput from "./types/NumberInput.vue"
import BooleanInput from "./types/BooleanInput.vue"
import ObjectInput from "./types/ObjectInput.vue"
import ArrayInput from "./types/ArrayInput.vue"
import AutomationSelector from "../automations/AutomationSelector.vue"
import ResourceInput from "./types/ResourceInput.vue"
import OverlayFontStyleInput from "./types/OverlayFontStyleInput.vue"
import MediaInput from "./types/MediaInput.vue"
import OverlayTransitionInput from "./types/OverlayTransitionInput.vue"
import OverlayTransitionTimingInput from "./types/OverlayTransitionTimingInput.vue"
import OverlayPaddingInput from "./types/OverlayPaddingInput.vue"
import ToggleInput from "./types/ToggleInput.vue"
import ColorInput from "./types/ColorInput.vue"
import LightColorInput from "./types/LightColorInput.vue"
import FolderInput from "./types/FolderInput.vue"
import OverlayWidgetInput from "./types/OverlayWidgetInput.vue"
import FileInput from "./types/FileInput.vue"
import DynamicTypeInput from "./types/DynamicTypeInput.vue"

const props = defineProps({
	schema: {},
	modelValue: {},
	label: {},
	context: {},
	secret: { type: Boolean, default: () => false },
	colorRefs: {},
	density: { type: String },
})
const emit = defineEmits(["update:modelValue"])
const labelString = computed(() => props.schema?.name || props.label)

const allProps = computed(() => {
	return {
		schema: props.schema,
		context: props.context,
		secret: props.secret,
		colorRefs: props.colorRefs,
		label: labelString.value,
		density: props.density,
	}
})

function clear() {
	emit("update:modelValue", undefined)
}

const modelObj = computed({
	get() {
		return props.modelValue
	},
	set(value) {
		if (value == null) return clear()
		emit("update:modelValue", value)
	},
})
</script>

<style>
.input-row {
	display: flex;
	flex-direction: row;
}
</style>
