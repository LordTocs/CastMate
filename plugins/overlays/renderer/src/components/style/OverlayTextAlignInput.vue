<template>
	<div class="flex flex-row align-items-center justify-content-center">
		<p-select-button v-model="model.textAlign" :options="['left', 'center', 'right', 'justify']">
			<template #option="slotProps">
				<i :class="textIcons[slotProps.option]"></i>
			</template>
		</p-select-button>
	</div>
</template>

<script setup lang="ts">
import { OverlayTextAlignment, SchemaOverlayTextAlignment } from "castmate-plugin-overlays-shared"
import { SharedDataInputProps, useDefaulted } from "castmate-ui-core"
import PSelectButton from "primevue/selectbutton"
import { useModel } from "vue"

const props = defineProps<
	{
		modelValue: OverlayTextAlignment
		schema: SchemaOverlayTextAlignment
	} & SharedDataInputProps
>()

const model = useDefaulted(useModel(props, "modelValue"), OverlayTextAlignment.factoryCreate())

const textIcons: Record<string, string> = {
	left: "mdi mdi-format-align-left",
	center: "mdi mdi-format-align-center",
	right: "mdi mdi-format-align-right",
	justify: "mdi mdi-format-align-justify",
}
</script>

<style scoped></style>
