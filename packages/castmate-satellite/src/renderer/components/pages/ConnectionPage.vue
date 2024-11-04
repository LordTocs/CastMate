<template>
	<div class="connection-page">
		<div class="account-div">
			<h3>Twitch Account</h3>
			<hr />
			<account-widget account-type="TwitchAccount" account-id="channel" />
		</div>
		<p-button @click="refresh"> Refresh Available Dashboards </p-button>
		<remote-dash-group v-for="group of rtcConnectionGroups" :options="group" />
	</div>
</template>

<script setup lang="ts">
import {
	AccountWidget,
	useGroupedDashboardRTCConnectionOptions,
	useInitStore,
	useSatelliteConnection,
} from "castmate-ui-core"
import PButton from "primevue/button"
import RemoteDashGroup from "../connection/RemoteDashGroup.vue"
import { onMounted } from "vue"

const satelliteStore = useSatelliteConnection()
const rtcConnectionGroups = useGroupedDashboardRTCConnectionOptions()

function refresh(ev: MouseEvent) {
	satelliteStore.refreshConnections()
}

onMounted(() => {
	satelliteStore.refreshConnections()
})
</script>

<style scoped>
.connection-page {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
}
</style>
