<template>
	<main-page-card>
		<template #header> <i class="mdi mdi-twitch twitch-purple" /> Twitch </template>
		<div class="flex flex-column flex-grow-1">
			<div class="flex flex-row justify-content-center">
				<twitch-stats />
			</div>
			<main-page-account-header class="flex-grow-1" />
			<stream-info-dashboard-card />
		</div>
	</main-page-card>
</template>

<script setup lang="ts">
import { MainPageCard } from "castmate-ui-core"

import MainPageAccountHeader from "./MainPageAccountHeader.vue"
import TwitchStats from "./TwitchStats.vue"
import StreamInfoDashboardCard from "../stream-info/StreamInfoDashboardCard.vue"
</script>
