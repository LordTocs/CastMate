<template>
	<div class="dashboard-section-prop-edit">
		<div class="flex flex-row gap-1 mt-4">
			<div style="width: 0; flex: 1">
				<label-floater label="Columns" v-slot="labelProps">
					<p-input-number class="number-fix" v-model="model.columns" v-bind="labelProps" show-buttons />
				</label-floater>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import PInputNumber from "primevue/inputnumber"
import { LabelFloater } from "castmate-ui-core"
import { DashboardSection } from "castmate-plugin-dashboards-shared"
import { useModel } from "vue"

const props = defineProps<{
	modelValue: DashboardSection
}>()

const model = useModel(props, "modelValue")
</script>

<style scoped>
.dashboard-section-prop-edit {
	padding: 0.5rem;
	margin: 0.5rem;
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
}

.number-fix :deep(.p-inputtext) {
	width: 100% !important;
}
</style>
