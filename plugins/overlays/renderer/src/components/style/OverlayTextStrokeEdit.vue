<template>
	<div class="stroke-edit" v-if="model">
		<div class="flex flex-row gap-1">
			<div class="mt-4 flex flex-column justify-content-center">
				<label>Stroke:</label>
			</div>
			<div style="width: 0; flex: 1" class="mt-4">
				<label-floater label="Width" v-slot="labelProps">
					<c-number-input
						class="number-fix"
						v-model="model.width"
						v-bind="labelProps"
						show-buttons
						:min="0"
						mode="decimal"
						suffix="px"
						local-path="width"
					/>
				</label-floater>
			</div>
			<div style="width: 0; flex: 1" class="mt-4">
				<data-input v-model="model.color" :schema="colorSchema" local-path="color" />
			</div>
			<div class="mt-4 flex flex-column justify-content-center">
				<p-button icon="mdi mdi-delete" text class="extra-small-button" @click="clearStroke"> </p-button>
			</div>
		</div>
	</div>
	<div class="flex flex-row justify-content-center mb-2 mt-2" v-else>
		<p-button class="flex-grow-1" size="small" icon="mdi mdi-plus" @click="addStroke"> Add Stroke </p-button>
	</div>
</template>

<script setup lang="ts">
import { useModel } from "vue"

import { OverlayStrokeStyle } from "castmate-plugin-overlays-shared"
import { LabelFloater, DataInput, CNumberInput } from "castmate-ui-core"
import { Color, declareSchema } from "castmate-schema"

import PInputNumber from "primevue/inputnumber"
import PButton from "primevue/button"

const props = defineProps<{
	modelValue: OverlayStrokeStyle | undefined
}>()

const model = useModel(props, "modelValue")

const colorSchema = declareSchema({
	type: Color,
	required: true,
	name: "Stroke Color",
})

function addStroke(ev: MouseEvent) {
	if (ev.button != 0) return

	model.value = {
		width: 3,
		color: "#000000",
	}
}

function clearStroke(ev: MouseEvent) {
	if (ev.button != 0) return

	model.value = undefined
}
</script>

<style scoped>
.stroke-edit {
	border-radius: var(--border-radius);
	border: solid 1px var(--surface-border);
	padding: 0.5rem;
	margin: 0.5rem;
}

.number-fix :deep(.p-inputtext) {
	width: 100% !important;
}
</style>
