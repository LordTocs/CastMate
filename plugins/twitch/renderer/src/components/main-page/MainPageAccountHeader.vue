<template>
	<div class="flex flex-row gap-3 flex-wrap justify-content-center">
		<twitch-account-widget account-id="channel" category="Channel" auth-message="Sign into your channel account." />
		<twitch-account-widget
			account-id="bot"
			category="Bot"
			auth-message="Sign into your bot account. (If you don't have a bot account, sign into your channel)"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useBotAccountResource, useChannelAccountResource } from "../../main"

import TwitchAccountWidget from "./TwitchAccountWidget.vue"
import TwitchStats from "./TwitchStats.vue"
</script>
