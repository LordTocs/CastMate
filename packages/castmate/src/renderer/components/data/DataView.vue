<template>
	<div v-if="!schema || value === undefined" />
	<div
		v-else-if="schema.type == 'Object' && schema.properties"
		:class="[{ 'horizontal-layout': horizontal }]"
	>
		<data-view
			v-for="key in previewProperties"
			:key="key"
			:schema="schema.properties[key]"
			:value="value[key]"
			:horizontal="horizontal"
		/>
	</div>
	<p
		v-else-if="
			schema.type == 'String' ||
			schema.type == 'Number' ||
			schema.type == 'FilePath' ||
			schema.type == 'Automation' ||
			schema.type == 'Duration' ||
			schema.type == 'ChannelPointReward' ||
			schema.type == 'File' ||
			schema.type == 'Folder'
		"
	>
		<span class="text--secondary" v-if="schema.name || label">
			{{ schema.name || label }}:
		</span>
		{{ value }}{{ schema.unit ? schema.unit.short : "" }}
	</p>
	<boolean-view
		v-else-if="schema.type == 'Boolean'"
		:schema="schema"
		:modelValue="value"
		:label="label"
	/>
	<toggle-view
		v-else-if="schema.type == 'Toggle'"
		:schema="schema"
		:modelValue="value"
		:label="label"
	/>
	<color-view
		v-else-if="schema.type == 'Color'"
		:schema="schema"
		:modelValue="value"
		:label="label"
	/>
	<light-color-view
		v-else-if="schema.type == 'LightColor'"
		:schema="schema"
		:modelValue="value"
		:label="label"
	/>
	<range-view
		v-else-if="schema.type == 'Range' && value"
		:schema="schema"
		:modelValue="value"
		:label="label"
	/>
	<resource-view
		v-else-if="schema.type == 'Resource' && value"
		:schema="schema"
		:modelValue="value"
		:label="label"
	/>
	<overlay-widget-view
		v-else-if="schema.type == 'OverlayWidget' && value"
		:schema="schema"
		:modelValue="value"
		:label="label"
	/>
	<media-view
		v-else-if="schema.type == 'MediaFile' && value"
		:schema="schema"
		:modelValue="value"
		:label="label"
	/>
</template>

<script setup>
import OverlayWidgetView from "./views/OverlayWidgetView.vue"
import ResourceView from "./views/ResourceView.vue"
import MediaView from "./views/MediaView.vue"
import ColorView from "./views/ColorView.vue"
import LightColorView from "./views/LightColorView.vue"
import BooleanView from "./views/BooleanView.vue"
import ToggleView from "./views/ToggleView.vue"

import { computed } from "vue"
import RangeView from "./views/RangeView.vue"

const props = defineProps({
	schema: {},
	value: {},
	label: {},
	horizontal: { type: Boolean, default: () => false },
})

const previewProperties = computed(() =>
	Object.keys(props.schema.properties).filter((k) => {
		if (!(k in props.value)) return false
		if (props.schema.properties[k].preview === false) return false
		return true
	})
)
</script>

<style scoped>
.one-text-line {
	text-overflow: ellipsis;
}
p:last-child {
	margin-bottom: 0px;
}
.horiztonal-layout {
	display: flex;
	flex-direction: row;
}
</style>
