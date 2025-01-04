<template>
	<div class="stat-block flex flex-row gap-2 p-3" v-if="channelAccount?.state.authenticated">
		<div class="stat-item">
			<span class="stat-label">Channel</span>
			<div class="stat-value">
				<p-avatar :image="channelAccount.config.icon" shape="circle" />
			</div>
		</div>
		<div class="stat-divider" />
		<div class="stat-item">
			<span class="stat-label">Followers</span>
			<div class="stat-value">
				<span>{{ followers?.value }} <i class="mdi mdi-heart" /></span>
			</div>
		</div>
		<div class="stat-divider" />
		<div class="stat-item">
			<span class="stat-label">Subscribers</span>
			<div class="stat-value">
				<span>{{ subscribers?.value }} <i class="mdi mdi-star" /></span>
			</div>
		</div>
		<div class="stat-divider" />
		<div v-if="live?.value" class="stat-item">
			<span class="stat-label">Live</span>
			<div class="stat-value">
				<span>{{ viewers?.value }} <i class="mdi mdi-account" /></span>
			</div>
		</div>
		<div v-else class="stat-item">
			<span class="stat-label">Offline</span>
			<div class="stat-value">
				<span>-- <i class="mdi mdi-account" /></span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useState } from "castmate-ui-core"
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
