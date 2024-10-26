<template>
	<div class="dashboard-section">
		<div class="section-header">
			{{ section.name }}
		</div>
		<div class="section-grid">
			<dashboard-widget v-for="widget in section.widgets" :widget="widget" :key="widget.id" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { DashboardSection } from "castmate-plugin-dashboards-shared"
import DashboardWidget from "./DashboardWidget.vue"

const props = defineProps<{
	section: DashboardSection
}>()
</script>

<style scoped>
.section-grid {
	--column-count: 4;

	display: grid;
	--row-height: 56px;
	--grid-gap: 0.25rem;

	padding: 0.25rem;
	gap: var(--grid-gap);
	grid-template-columns: repeat(var(--column-count), 1fr);
	grid-template-rows: repeat(auto-fill, var(--row-height));
}

.section-header {
}

.dashboard-section {
}
</style>
