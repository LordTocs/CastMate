<template>
	<div class="connection-page">
		<div class="account-div">
			<h3>Twitch Account</h3>
			<hr />
			<account-widget account-type="TwitchAccount" account-id="channel" />
		</div>
		<remote-dash-group v-for="group of rtcConnectionGroups" :options="group" />
	</div>
</template>

<script setup lang="ts">
import { AccountWidget, useGroupedDashboardRTCConnectionOptions, useInitStore } from "castmate-ui-core"
import RemoteDashGroup from "../connection/RemoteDashGroup.vue"

const rtcConnectionGroups = useGroupedDashboardRTCConnectionOptions()
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
