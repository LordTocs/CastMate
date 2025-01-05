<template>
	<div class="stat-block flex flex-row p-3" v-if="channelAccount?.state.authenticated">
		<main-page-card-item label="Channel">
			<p-avatar :image="channelAccount?.config.icon" shape="circle" />
		</main-page-card-item>
		<main-page-card-item label="Followers">
			<span v-if="channelAccount?.state.authenticated">{{ followers?.value }}</span
			><span v-else>--</span>
		</main-page-card-item>
		<main-page-card-item label="Subscribers">
			<span v-if="channelAccount?.state.authenticated">{{ subscribers?.value }}</span
			><span v-else>--</span>
		</main-page-card-item>
		<main-page-card-item v-if="live?.value" label="Viewers">
			<span v-if="channelAccount?.state.authenticated">{{ viewers?.value }}</span
			><span v-else>--</span>
		</main-page-card-item>
		<main-page-card-item v-else label="Offline">
			<span>--</span>
		</main-page-card-item>
	</div>
</template>

<script setup lang="ts">
import { useState, MainPageCardItem } from "castmate-ui-core"
import { useChannelAccountResource } from "../../main"
import PAvatar from "primevue/avatar"

const channelAccount = useChannelAccountResource()

const followers = useState<number>({ plugin: "twitch", state: "followers" })
const viewers = useState<number>({ plugin: "twitch", state: "viewers" })
const subscribers = useState<number>({ plugin: "twitch", state: "subscribers" })
const live = useState<boolean>({ plugin: "twitch", state: "live" })
</script>

<style scoped>
.stat-block {
	border-radius: var(--border-radius);
	/* border: solid 2px var(--surface-border); */
	flex-basis: 200px;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1 0 0;
	width: 100px;
}
.stat-value {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.stat-label {
	color: var(--p-surface-400);
}

.stat-divider {
	border-right: solid 1px var(--surface-border);
}
</style>
