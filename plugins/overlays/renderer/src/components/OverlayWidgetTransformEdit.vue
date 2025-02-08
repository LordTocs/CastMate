<template>
	<div class="transform-edit">
		<div class="flex flex-row gap-1 mt-4">
			<div style="width: 0; flex: 1">
				<label-floater label="X" v-slot="labelProps">
					<c-number-input
						v-model="model.position.x"
						v-bind="labelProps"
						show-buttons
						suffix="px"
						local-path="position.x"
						style="width: 100%"
					/>
				</label-floater>
			</div>
			<div style="width: 0; flex: 1">
				<label-floater label="Y" v-slot="labelProps">
					<c-number-input
						v-model="model.position.y"
						v-bind="labelProps"
						show-buttons
						suffix="px"
						local-path="position.y"
						style="width: 100%"
					/>
				</label-floater>
			</div>
		</div>
		<div class="flex flex-row gap-1 mt-4">
			<div style="width: 0; flex: 1">
				<label-floater label="Width" v-slot="labelProps">
					<c-number-input
						v-model="model.size.width"
						v-bind="labelProps"
						suffix="px"
						style="width: 100%"
						local-path="size.width"
					/>
				</label-floater>
			</div>
			<div style="width: 0; flex: 1">
				<label-floater label="Height" v-slot="labelProps">
					<c-number-input
						v-model="model.size.height"
						v-bind="labelProps"
						show-buttons
						suffix="px"
						local-path="size.height"
						style="width: 100%"
					/>
				</label-floater>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import PInputNumber from "primevue/inputnumber"
import { OverlayWidgetPosition, OverlayWidgetSize } from "castmate-plugin-overlays-shared"

import { LabelFloater, CNumberInput } from "castmate-ui-core"
import { useModel } from "vue"

const props = defineProps<{
	modelValue: {
		size: OverlayWidgetSize
		position: OverlayWidgetPosition
	}
}>()

const model = useModel(props, "modelValue")
</script>

<style scoped>
.transform-edit {
	padding: 0.5rem;
	margin: 0.5rem;
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
}

.number-fix :deep(.p-inputtext) {
	width: 100% !important;
}
</style>
