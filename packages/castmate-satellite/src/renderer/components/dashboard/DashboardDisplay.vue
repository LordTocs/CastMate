<template>
	<div class="flex-grow-1 flex flex-column">
		<div class="page-header"></div>
		<dashboard-page :page="currentPage"> </dashboard-page>
	</div>
</template>

<script setup lang="ts">
import DashboardPage from "./DashboardPage.vue"
import YAML from "yaml"
import { DashboardConfig } from "castmate-plugin-dashboards-shared"
import { computed, ref } from "vue"
import { useDashboardRTCBridge } from "../../util/dashboard-rtc-bridge"

const currentPageIndex = ref(0)

const bridge = useDashboardRTCBridge()

const currentPage = computed(() => {
	const clampedIdx = Math.min(Math.max(currentPageIndex.value, 0), bridge.config.pages.length - 1)
	return bridge.config.pages[clampedIdx]
})
</script>

<style scoped></style>
