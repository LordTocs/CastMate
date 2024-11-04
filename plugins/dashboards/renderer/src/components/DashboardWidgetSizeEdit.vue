<template>
	<div class="dashboard-size-edit">
		<div class="flex flex-row gap-1 mt-4">
			<div style="width: 0; flex: 1">
				<label-floater label="Width" v-slot="labelProps">
					<p-input-number class="number-fix" v-model="model.width" v-bind="labelProps" show-buttons />
				</label-floater>
			</div>
			<div style="width: 0; flex: 1">
				<label-floater label="Height" v-slot="labelProps">
					<p-input-number class="number-fix" v-model="model.height" v-bind="labelProps" show-buttons />
				</label-floater>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import PInputNumber from "primevue/inputnumber"
import { LabelFloater } from "castmate-ui-core"
import { DashboardWidgetSize } from "castmate-plugin-dashboards-shared"
import { useModel } from "vue"

const props = defineProps<{
	modelValue: DashboardWidgetSize
}>()

const model = useModel(props, "modelValue")
</script>

<style scoped>
.dashboard-size-edit {
	padding: 0.5rem;
	margin: 0.5rem;
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
}

.number-fix :deep(.p-inputtext) {
	width: 100% !important;
}
</style>
