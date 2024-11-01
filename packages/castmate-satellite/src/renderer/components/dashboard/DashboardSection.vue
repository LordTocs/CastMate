<template>
	<div class="dashboard-section" :style="{ '--column-count': section.columns ?? 4 }">
		<div class="section-header">
			{{ section.name }}
		</div>
		<div class="section-grid">
			<dashboard-widget
				v-for="widget in section.widgets"
				:widget="widget"
				:key="widget.id"
				:page="page"
				:section="section.id"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { DashboardSection } from "castmate-plugin-dashboards-shared"
import DashboardWidget from "./DashboardWidget.vue"

const props = defineProps<{
	page: string
	section: DashboardSection
}>()
</script>

<style scoped>
.section-grid {
	display: grid;
	--row-height: 100px;
	--grid-gap: 0.25rem;
	--column-width: 100px;

	padding: 0.25rem;

	width: calc(var(--column-count) * var(--column-width));

	gap: var(--grid-gap);
	grid-template-columns: repeat(var(--column-count), 1fr);
	grid-template-rows: repeat(auto-fill, var(--row-height));
}

.section-header {
}

.dashboard-section {
	padding: 0.5rem;
	border-radius: var(--border-radius);

	border: solid white 1px;
}
</style>
