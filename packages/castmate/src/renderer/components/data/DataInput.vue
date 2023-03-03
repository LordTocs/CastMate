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
		v-else-if="schema.type == 'Number' && !schema.slider && !schema.enum"
		v-model="modelObj"
		:allowTemplate="!!schema.template"
		:clearable="!schema.required"
		:unit="schema.unit"
		v-bind="allProps"
	/>
	<resource-input
		v-else-if="schema.type == 'Resource'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<template v-else-if="schema.type == 'Number' && schema.slider">
		<div class="text-caption">{{ labelString }}</div>
		<v-slider
			v-model="modelObj"
			:name="labelString"
			:min="schema.slider.min"
			:max="schema.slider.max"
			:step="schema.slider.step"
			:density="density"
			color="white"
			:append-icon="!schema.required ? 'mdi-close' : undefined"
			@click:append="clear"
		/>
	</template>
	<enum-input
		v-else-if="schema.type == 'Number' && schema.enum"
		:enum="schema.enum || schema.enumQuery"
		:queryMode="!!schema.enumQuery"
		v-model="modelObj"
		:label="labelString"
		:clearable="!schema.required"
		:context="context"
		:template="schema.template"
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
	<file-autocomplete
		v-else-if="schema.type == 'FilePath'"
		v-model="modelObj"
		:recursive="!!schema.recursive"
		:path="schema.path"
		:basePath="schema.basePath"
		:clearable="!schema.required"
		:ext="schema.exts || []"
		:label="labelString"
		:density="density"
	/>
	<color-picker
		v-else-if="schema.type == 'LightColor'"
		v-model="modelObj"
		:schema="schema"
		:clearable="!schema.required"
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
	<folder-input
		v-else-if="schema.type == 'Folder'"
		v-model="modelObj"
		v-bind="allProps"
	/>
	<overlay-widget-input
		v-else-if="schema.type == 'OverlayWidget'"
		v-model="modelObj"
		v-bind="allProps"
	/>
</template>

<script>
import ColorPicker from "./ColorPicker.vue"
import FileAutocomplete from "./FileAutocomplete.vue"
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
import EnumInput from "./types/EnumInput.vue"
import OverlayTransitionInput from "./types/OverlayTransitionInput.vue"
import OverlayTransitionTimingInput from "./types/OverlayTransitionTimingInput.vue"
import OverlayPaddingInput from "./types/OverlayPaddingInput.vue"
import ToggleInput from "./types/ToggleInput.vue"
import ColorInput from "./types/ColorInput.vue"
import FolderInput from "./types/FolderInput.vue"
import OverlayWidgetInput from "./types/OverlayWidgetInput.vue"

export default {
	name: "data-input",
	components: {
		ObjectInput,
		ArrayInput,
		NumberInput,
		FileAutocomplete,
		StringInput,
		ColorPicker,
		AutomationSelector,
		RewardSelector,
		RangeInput,
		TimeInput,
		BooleanInput,
		ResourceInput,
		OverlayFontStyleInput,
		MediaInput,
		EnumInput,
		OverlayTransitionInput,
		OverlayTransitionTimingInput,
		OverlayPaddingInput,
		ToggleInput,
		ColorInput,
		FolderInput,
		OverlayWidgetInput,
	},
	props: {
		schema: {},
		modelValue: {},
		label: {},
		context: { type: Object },
		secret: { type: Boolean, default: () => false },
		colorRefs: {},
		density: { type: String },
	},
	emits: ["update:modelValue"],
	computed: {
		labelString() {
			return this.schema?.name || this.label
		},
		allProps() {
			return {
				schema: this.schema,
				context: this.context,
				secret: this.secret,
				colorRefs: this.colorRefs,
				label: this.labelString,
				density: this.density,
			}
		},
		modelObj: {
			get() {
				return this.modelValue
			},
			set(newValue) {
				if (newValue === null) {
					//Need this to handle clearable returning null instead of undefined.
					this.clear()
				}
				this.$emit("update:modelValue", newValue)
			},
		},
	},
	methods: {
		clear() {
			this.$emit("update:modelValue", undefined)
		},
	},
}
</script>

<style>
.input-row {
	display: flex;
	flex-direction: row;
}
</style>
