<template>
	<main-page-card>
		<template #header> <i class="mdi mdi-twitch twitch-purple" /> Twitch </template>
		<div class="flex flex-column flex-grow-1 gap-2">
			<unauthed-twitch-account-error
				account-id="channel"
				category="Channel"
				auth-message="CastMate needs your Twitch account to run"
			/>
			<unauthed-twitch-account-error
				account-id="bot"
				category="Bot"
				auth-message="CastMate needs a bot account to run. You can use a separate bot account or just sign into your channel again."
			/>
			<div class="flex flex-row justify-content-center">
				<twitch-stats />
			</div>
			<stream-info-dashboard-card />
		</div>
	</main-page-card>
</template>

<script setup lang="ts">
import { MainPageCard } from "castmate-ui-core"

import UnauthedTwitchAccountError from "./UnauthedTwitchAccountError.vue"
import TwitchStats from "./TwitchStats.vue"
import StreamInfoDashboardCard from "../stream-info/StreamInfoDashboardCard.vue"
</script>
