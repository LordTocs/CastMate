<template>
	<div class="flex-grow-1 flex flex-column">
		<div class="page-header">
			<p-button icon="mdi mdi-arrow-left-bold" :disabled="!hasLeft" @click="pageLeft"></p-button>
			<div class="flex-grow-1 text-center">
				{{ currentPage?.name }}
			</div>
			<p-button @click="pageStore.page = 'slots'" size="small" class="mx-3">
				<i class="mdi mdi-cog"></i> Slots
			</p-button>
			<p-button icon="mdi mdi-arrow-right-bold" :disabled="!hasRight" @click="pageRight"></p-button>
		</div>
		<dashboard-page :page="currentPage" v-if="currentPage"> </dashboard-page>
	</div>
</template>

<script setup lang="ts">
import DashboardPage from "./DashboardPage.vue"
import YAML from "yaml"
import { DashboardConfig } from "castmate-plugin-dashboards-shared"
import { computed, ref } from "vue"
import { useDashboardRTCBridge } from "../../util/dashboard-rtc-bridge"
import PButton from "primevue/button"
import { usePageStore } from "../../util/page-store"

const currentPageIndex = ref(0)

const pageStore = usePageStore()

const clampedPageIndex = computed(() => {
	return Math.min(Math.max(currentPageIndex.value, 0), bridge.config.pages.length - 1)
})

const hasLeft = computed(() => {
	return clampedPageIndex.value > 0
})

const hasRight = computed(() => {
	return clampedPageIndex.value < bridge.config.pages.length
})

const bridge = useDashboardRTCBridge()

const currentPage = computed(() => {
	const clampedIdx = clampedPageIndex.value
	return bridge.config.pages[clampedIdx]
})

function pageLeft(ev: MouseEvent) {
	currentPageIndex.value = clampedPageIndex.value - 1
}

function pageRight(ev: MouseEvent) {
	currentPageIndex.value = clampedPageIndex.value + 1
}
</script>

<style scoped>
.page-header {
	background-color: var(--surface-c);
	min-height: 3rem;

	display: flex;
	flex-direction: row;
	align-items: center;
}
</style>
