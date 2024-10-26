<template>
	<div class="dashboard-page flex-grow-1">
		<dashboard-section v-for="section in page.sections" :key="section.id" :section="section" />
	</div>
</template>

<script setup lang="ts">
import { DashboardPage } from "castmate-plugin-dashboards-shared"
import DashboardSection from "./DashboardSection.vue"

const props = defineProps<{
	page: DashboardPage
}>()
</script>

<style scoped>
.dashboard-page {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;

	align-items: center;
	justify-content: center;

	padding: 1rem;
	gap: 1rem;
}
</style>
