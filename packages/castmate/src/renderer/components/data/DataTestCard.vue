<template>
	<v-card>
		<v-card-text>
			<v-row>
				<v-col>
					<data-input
						v-model="data"
						:schema="schema"
						:context="data"
					/>
				</v-col>
				<v-col>
					<data-view :value="data" :schema="schema" />
				</v-col>
			</v-row>
		</v-card-text>
	</v-card>
</template>

<script setup>
import DataView from "./DataView.vue"
import DataInput from "./DataInput.vue"
import { ref, computed } from "vue"

const data = ref({})

const schema = computed(() => ({
	type: "Object",
	properties: {
		str: {
			type: "String",
			name: "String",
			required: true,
			template: true,
		},
		strEnum: {
			type: "String",
			name: "String Enum",
			required: true,
			template: true,
			enum: ["A", "B", "C", "D"],
		},
		light: {
			type: "Resource",
			name: "Light",
			resourceType: "light",
		},
		color: { type: "Color", name: "Color", template: true, required: true },
		lightColor: {
			type: "LightColor",
			name: "Light Color",
			resource: "light",
			template: true,
		},
		numberValue: {
			type: "Number",
			name: "Number",
			min: 0,
			max: 1000,
			template: true,
			required: true,
		},
		sliderValue: {
			type: "Number",
			name: "Slider",
			min: 0,
			max: 1,
			step: 0.01,
			slider: true,
			template: true,
		},
		numberEnum: {
			type: "Number",
			name: "Number Enum",
			enum: [1, 2, 3, 4, 5],
			template: true,
		},
		range: {
			type: "Range",
			name: "Range",
		},
		duration: {
			type: "Duration",
			name: "Duration",
			template: true,
		},
		folder: {
			type: "Folder",
			name: "Folder",
		},
		bool: {
			type: "Boolean",
			name: "Boolean",
			default: false,
		},
		toggle: {
			type: "Toggle",
			name: "Toggler",
			default: false,
		},
		widget: {
			type: "OverlayWidget",
			name: "Overlay Widget",
			widgetType: "Alert",
		},
		media: {
			type: "MediaFile",
			name: "Media",
			sound: true,
			image: true,
			video: true,
		},
	},
}))
</script>
