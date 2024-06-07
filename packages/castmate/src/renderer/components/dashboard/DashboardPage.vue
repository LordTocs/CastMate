<template>
	<flex-scroller>
		<div class="dashboard">
			<div class="stat-row">
				<dashboard-card>
					<template #header> <i class="mdi mdi-twitch twitch-purple" /> Twitch </template>
					<dashboard-stat plugin="twitch" state="viewers" label="Viewers" />
					<dashboard-stat plugin="twitch" state="followers" label="Followers" />
					<dashboard-stat plugin="twitch" state="subscribers" label="Subscribers" />
				</dashboard-card>
				<dashboard-obs-card v-for="obs in obsConnections" :key="obs.id" :obs-id="obs.id" />
			</div>
			<div class="stat-row">
				<stream-info-dashboard-card />
				<stream-plan-dashboard-widget />
			</div>
			<action-queue-dash-widget v-for="queue in queues" :key="queue.id" :queue-id="queue.id" class="mb-2" />
		</div>
	</flex-scroller>
</template>

<script setup lang="ts">
import {
	useResourceArray,
	FlexScroller,
	DashboardStat,
	DashboardCard,
	StreamPlanDashboardWidget,
} from "castmate-ui-core"
import ActionQueueDashWidget from "./queues/ActionQueueDashWidget.vue"
import { DashboardObsCard } from "castmate-plugin-obs-renderer"
import { StreamInfoDashboardCard } from "castmate-plugin-twitch-renderer"

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
