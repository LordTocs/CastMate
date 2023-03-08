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
			schema.type == 'Duration'
		"
	>
		<span class="text--secondary" v-if="schema.name || label">
			{{ schema.name || label }}:
		</span>
		{{ value }}{{ schema.unit ? schema.unit.short : "" }}
	</p>
	<p v-else-if="schema.type == 'Boolean'">
		<span class="text--secondary" v-if="schema.name || label">
			{{ schema.name || label }}:
		</span>
		<v-icon>
			{{
				value
					? schema.trueIcon
						? schema.trueIcon
						: "mdi-check-bold"
					: schema.falseIcon
					? schema.falseIcon
					: "mdi-close-bold"
			}}
		</v-icon>
	</p>
	<p v-else-if="schema.type == 'Toggle'">
		<span class="text--secondary" v-if="schema.name || label">
			{{ schema.name || label }}:
		</span>
		<v-icon v-if="value === true">
			{{ schema.trueIcon ? schema.trueIcon : "mdi-check-bold" }}
		</v-icon>
		<v-icon v-else-if="value === 'toggle'">
			{{ schema.toggleIcon ? schema.toggleIcon : "mdi-swap-horizontal" }}
		</v-icon>
		<v-icon v-else-if="!value">
			{{ schema.falseIcon ? schema.falseIcon : "mdi-close-bold" }}
		</v-icon>
	</p>
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
	<p v-else-if="schema.type == 'ChannelPointReward'">
		<span class="text--secondary" v-if="schema.name || label">
			{{ schema.name || label }}: </span
		>{{ value }}
		<!--reward-edit-button :rewardName="value" /-->
	</p>
	<p v-else-if="schema.type == 'Range' && value">
		<span class="text--secondary" v-if="schema.name || label">
			{{ schema.name || label }}: </span
		>{{ value.min != undefined && value.min != null ? value.min : `-∞` }} ⟶
		{{ value.max != undefined && value.max != null ? value.max : `∞` }}
	</p>
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

<script>
import OverlayWidgetView from "./views/OverlayWidgetView.vue"
import ResourceView from "./views/ResourceView.vue"
import MediaView from "./views/MediaView.vue"
import ColorView from "./views/ColorView.vue"
import LightColorView from "./views/LightColorView.vue"
export default {
	components: {
		ResourceView,
		MediaView,
		OverlayWidgetView,
		ColorView,
		LightColorView,
	},
	name: "data-view",
	props: {
		schema: {},
		value: {},
		label: {},
		horizontal: { type: Boolean, default: () => false },
	},
	computed: {
		previewProperties() {
			return Object.keys(this.value).filter(
				(k) => this.schema.properties[k]?.preview != false
			)
		},
	},
}
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
