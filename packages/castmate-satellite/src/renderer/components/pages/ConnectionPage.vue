<template>
	<div class="connection-page">
		<div class="account-div">
			<h3>Twitch Account</h3>
			<hr />
			<account-widget account-type="TwitchAccount" account-id="channel" />
		</div>
		<remote-dash-group :options="testData" />
	</div>
</template>

<script setup lang="ts">
import { AccountWidget, useInitStore } from "castmate-ui-core"
import RemoteDashGroup from "../connection/RemoteDashGroup.vue"
import { DashboardConnectionOption } from "../../util/connection-types"

const testData: DashboardConnectionOption[] = [
	{
		remoteService: "twitch",
		remoteUserId: "",
		remoteDisplayName: "LordTocs",
		remoteDisplayIcon:
			"https://static-cdn.jtvnw.net/jtv_user_pictures/0e855a1c-a185-482b-860c-b2826901e0c3-profile_image-300x300.png",
		dashId: "",
		dashName: "Test Board 1",
	},
	{
		remoteService: "twitch",
		remoteUserId: "",
		remoteDisplayName: "LordTocs",
		remoteDisplayIcon:
			"https://static-cdn.jtvnw.net/jtv_user_pictures/0e855a1c-a185-482b-860c-b2826901e0c3-profile_image-300x300.png",
		dashId: "",
		dashName: "Test Board 2",
	},
]
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
