<template>
	<flex-scroller>
		<div class="flex flex-row flex-wrap gap-2 px-2">
			<obs-main-page-card />
		</div>
		<div class="flex flex-row flex-wrap gap-2 px-2">
			<twitch-main-page-card class="flex-grow-1" style="flex-basis: 0" />
			<stream-plan-dashboard-widget />
		</div>
		<div class="flex flex-column gap-2 px-2">
			<action-queue-dash-widget v-for="queue in queues" :queue-id="queue.id" :key="queue.id" />
		</div>
	</flex-scroller>
</template>

<script setup lang="ts">
import { useResourceArray, FlexScroller } from "castmate-ui-core"

import { TwitchMainPageCard } from "castmate-plugin-twitch-renderer"
import { ObsMainPageCard } from "castmate-plugin-obs-renderer"
import ActionQueueDashWidget from "../dashboard/queues/ActionQueueDashWidget.vue"
import StreamPlanDashboardWidget from "../../../../../../libs/castmate-ui-core/src/components/stream-plan/StreamPlanDashboardWidget.vue"

const queues = useResourceArray("ActionQueue")
const obsConnections = useResourceArray("OBSConnection")
</script>

<style scoped>
.dashboard {
	--dashboard-height: 100px;
	padding-left: 0.5rem;
	padding-right: 0.5rem;
}
.stat-row {
	display: flex;
	flex-direction: row;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
	justify-content: center;
	gap: 0.5rem;
}
</style>
