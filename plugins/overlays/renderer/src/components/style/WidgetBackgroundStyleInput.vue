<template>
	<div>
		<label-floater :model="true" :label="getDataLabel(props)" v-slot="labelProps">
			<input-box :model="true" v-bind="labelProps" class="w-full">
				<template v-if="model">
					<draggable-collection
						v-model="model.elements"
						handle-class="drag-handle"
						data-type="widget-background-style-element"
						:local-path="localPath"
					>
						<template #no-items> </template>
						<template #item="{ item, index }">
							<widget-background-element-edit
								v-model="model.elements[index]"
								@delete="deleteElement(index)"
							/>
						</template>
					</draggable-collection>
				</template>
				<div v-if="model?.color != null">
					<widget-color-background-edit v-model="model" />
				</div>
				<div class="flex flex-row">
					<p-button @click="toggleColor" size="small" text><i class="mdi mdi-format-color-fill" /></p-button>
					<p-button @click="addGradient" size="small" text
						><i class="mdi mdi-gradient-horizontal"
					/></p-button>
					<p-button @click="addImage" size="small" text><i class="mdi mdi-image" /></p-button>
				</div>
			</input-box>
		</label-floater>
	</div>
</template>

<script setup lang="ts">
import {
	SchemaWidgetBackgroundStyle,
	WidgetBackgroundGradient,
	WidgetBackgroundImage,
	WidgetBackgroundStyle,
	WidgetBackgroundStyleElement,
} from "castmate-plugin-overlays-shared"
import {
	SharedDataInputProps,
	useDataBinding,
	DraggableCollection,
	useDefaultableModel,
	InputBox,
	LabelFloater,
	getDataLabel,
} from "castmate-ui-core"
import PButton from "primevue/button"

import WidgetBackgroundElementEdit from "./background/WidgetBackgroundElementEdit.vue"
import WidgetColorBackgroundEdit from "./background/WidgetColorBackgroundEdit.vue"

const props = defineProps<
	{
		schema: SchemaWidgetBackgroundStyle
	} & SharedDataInputProps
>()

const model = defineModel<WidgetBackgroundStyle>()

const elements = useDefaultableModel(model, "elements", new Array<WidgetBackgroundStyleElement>(), () => ({
	elements: [],
}))

function deleteElement(index: number) {
	if (!model.value) return

	model.value.elements.splice(index, 1)
}

function addImage() {
	if (!model.value) {
		model.value = {
			elements: [{ image: "" }],
		}
	} else {
		model.value.elements.unshift({ image: "" })
	}
}

function addGradient() {
	const newGradient: WidgetBackgroundGradient = {
		gradient: {
			stops: [
				{ color: "#FF00DC", position: 0 },
				{ color: "#00FFFF", position: 1 },
			],
			angle: 0,
			gradientType: "linear",
		},
	}

	if (!model.value) {
		model.value = { elements: [newGradient] }
	} else {
		model.value.elements.unshift(newGradient)
	}
}

function toggleColor() {
	if (!model.value) {
		model.value = {
			color: "#FF0000",
			elements: [],
		}
	} else {
		if (model.value.color) {
			model.value.color = undefined
		} else {
			model.value.color = "#FF0000"
		}
	}
}
</script>

<style scoped>
.widget-background-style {
	background: var(--p-inputtext-background);
	padding-block: var(--p-inputtext-padding-y);
	padding-inline: var(--p-inputtext-padding-x);
	border: 1px solid var(--p-inputtext-border-color);
	border-radius: var(--border-radius);
}
</style>
