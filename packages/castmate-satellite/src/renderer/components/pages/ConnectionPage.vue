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
	usePrimarySatelliteConnection,
	useSatelliteConnection,
} from "castmate-ui-core"
import PButton from "primevue/button"
import RemoteDashGroup from "../connection/RemoteDashGroup.vue"
import { onMounted, watch } from "vue"
import { usePageStore } from "../../util/page-store"

const satelliteStore = useSatelliteConnection()
const rtcConnectionGroups = useGroupedDashboardRTCConnectionOptions()

function refresh(ev: MouseEvent) {
	satelliteStore.refreshConnections()
}

const connection = usePrimarySatelliteConnection()
const pageStore = usePageStore()

onMounted(() => {
	satelliteStore.refreshConnections()

	watch(
		() => connection.value?.state,
		() => {
			if (!connection.value?.state) return

			if (connection.value.state == "connected") pageStore.page = "dashboard"
			if (connection.value.state == "connecting") pageStore.page = "connecting"
		}
	)
})
</script>

<style scoped>
.connection-page {
	display: flex;
	flex-grow: 1;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
}
</style>
