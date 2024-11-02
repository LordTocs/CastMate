<template>
	<flex-scroller class="flex-grow-1" inner-class="dashboard-page">
		<dashboard-section v-for="section in page.sections" :key="section.id" :section="section" :page="page.id" />
	</flex-scroller>
</template>

<script setup lang="ts">
import { DashboardPage } from "castmate-plugin-dashboards-shared"
import DashboardSection from "./DashboardSection.vue"
import { FlexScroller } from "castmate-ui-core"

const props = defineProps<{
	page: DashboardPage
}>()
</script>

<style scoped>
:deep(.dashboard-page) {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;

	align-items: stretch;
	justify-content: center;

	padding: 1rem;
	gap: 1rem;
}
</style>
