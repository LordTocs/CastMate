<template>
	<div class="style-edit p-2">
		<div class="flex flex-row gap-1 mt-4">
			<div style="width: 0; flex: 1">
				<font-select class="w-full" v-model="model.fontFamily" label="Font" />
			</div>
			<div style="width: 0; flex: 1">
				<label-floater label="Size" v-slot="labelProps">
					<p-input-number v-model="model.fontSize" v-bind="labelProps" show-buttons :min="0" mode="decimal" />
				</label-floater>
			</div>
		</div>
		<div class="flex flex-row gap-1 mt-4">
			<data-input class="flex-grow-1" v-model="model.fontColor" :schema="colorSchema" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { OverlayTextStyle } from "castmate-plugin-overlays-shared"
import FontSelect from "./FontSelect.vue"
import PInputNumber from "primevue/inputnumber"
import { useModel } from "vue"

import { Color, declareSchema } from "castmate-schema"

import { LabelFloater, DataInput } from "castmate-ui-core"

const props = defineProps<{
	modelValue: OverlayTextStyle
}>()

const colorSchema = declareSchema({
	type: Color,
	required: true,
	name: "Font Color",
})

const model = useModel(props, "modelValue")
</script>

<style scoped>
.style-edit {
	min-width: 40rem;
	max-height: 30rem;
	overflow-y: auto;
	min-height: 10rem;
}
</style>
