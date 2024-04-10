<template>
	<div v-if="model != null" class="p-1 flex flex-column gap-4">
		<div class="flex flex-row pt-3 gap-1">
			<div style="width: 0; flex: 1">
				<data-input :schema="previewFileSchema" v-model="previewFileModel" />
			</div>
			<p-toggle-button
				v-model="obsToggleModel"
				on-icon="mdi mdi-eye-outline"
				on-label=""
				off-icon="mdi mdi-eye-off-outline"
				off-label=""
				class="extra-small-button"
			/>
		</div>
		<div class="flex flex-row pt-3 gap-1">
			<div style="width: 0; flex: 1">
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
			<div style="width: 0; flex: 1">
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
</template>

<script setup lang="ts">
import { OverlayPreviewConfig } from "castmate-plugin-overlays-shared"
import { computed, useModel } from "vue"

import { LabelFloater, DataInput } from "castmate-ui-core"
import PInputNumber from "primevue/inputnumber"
import PToggleButton from "primevue/togglebutton"
import { FilePath, declareSchema } from "castmate-schema"

const props = defineProps<{
	modelValue: OverlayPreviewConfig | undefined
}>()

const model = useModel(props, "modelValue")

const obsToggleModel = computed({
	get() {
		return model.value?.source == "obs"
	},
	set(v) {
		if (!model.value) {
			model.value = {
				offsetX: 0,
				offsetY: 0,
				source: v ? "obs" : undefined,
			}
		} else {
			model.value.source = v ? "obs" : undefined
		}
	},
})

const previewFileModel = computed({
	get() {
		if (model.value?.source == "obs") return undefined
		return model.value?.source
	},
	set(v) {
		if (!model.value) {
			model.value = {
				offsetX: 0,
				offsetY: 0,
				source: v,
			}
		} else {
			model.value.source = v
		}
	},
})

const previewFileSchema = declareSchema({
	type: FilePath,
	required: false,
	name: "Preview Image",
	extensions: [".png", ".jpg", ".bmp", ".webp"],
})
</script>

<style scoped>
.number-fix :deep(.p-inputtext) {
	width: 100% !important;
}
</style>
