<template>
	<div class="shadow-edit" v-if="model">
		<div class="flex flex-row gap-1">
			<div class="mt-4 flex flex-column justify-content-center">
				<label>Shadow:</label>
			</div>
			<div class="flex-grow-1">
				<div class="flex flex-row gap-1">
					<div style="width: 0; flex: 1" class="mt-4">
						<label-floater label="Blur" v-slot="labelProps">
							<p-input-number
								class="number-fix"
								v-model="model.blur"
								v-bind="labelProps"
								show-buttons
								:min="0"
								mode="decimal"
								suffix="px"
							/>
						</label-floater>
					</div>
					<div style="width: 0; flex: 1" class="mt-4">
						<data-input v-model="model.color" :schema="colorSchema" />
					</div>
				</div>
				<div class="flex flex-row gap-1">
					<div style="width: 0; flex: 1" class="mt-4">
						<label-floater label="Offset X" v-slot="labelProps">
							<p-input-number
								class="number-fix"
								v-model="model.offsetX"
								v-bind="labelProps"
								show-buttons
								mode="decimal"
								suffix="px"
							/>
						</label-floater>
					</div>
					<div style="width: 0; flex: 1" class="mt-4">
						<label-floater label="Offset Y" v-slot="labelProps">
							<p-input-number
								class="number-fix"
								v-model="model.offsetY"
								v-bind="labelProps"
								show-buttons
								mode="decimal"
								suffix="px"
							/>
						</label-floater>
					</div>
				</div>
			</div>
			<div class="mt-4 flex flex-column justify-content-center">
				<p-button icon="mdi mdi-delete" text class="extra-small-button" @click="clearShadow"> </p-button>
			</div>
		</div>
	</div>
	<div class="stroke-edit flex flex-row justify-content-center" v-else>
		<p-button class="flex-grow-1" size="small" icon="mdi mdi-plus" @click="addShadow"> Add Shadow </p-button>
	</div>
</template>

<script setup lang="ts">
import { useModel } from "vue"

import { OverlayShadowStyle } from "castmate-plugin-overlays-shared"
import { LabelFloater, DataInput } from "castmate-ui-core"
import { Color, declareSchema } from "castmate-schema"

import PInputNumber from "primevue/inputnumber"
import PButton from "primevue/button"

const props = defineProps<{
	modelValue: OverlayShadowStyle | undefined
}>()

const model = useModel(props, "modelValue")

const colorSchema = declareSchema({
	type: Color,
	required: true,
	name: "Shadow Color",
})

function addShadow(ev: MouseEvent) {
	if (ev.button != 0) return

	model.value = {
		blur: 4,
		color: "#FFFFFF",
		offsetX: 0,
		offsetY: 0,
	}
}

function clearShadow(ev: MouseEvent) {
	if (ev.button != 0) return

	model.value = undefined
}
</script>

<style scoped>
.shadow-edit {
	border-radius: var(--border-radius);
	border: solid 1px var(--surface-border);
	padding: 0.5rem;
	margin: 0.5rem;
}

.number-fix :deep(.p-inputtext) {
	width: 100% !important;
}
</style>
