<template>
	<flex-scroller>
		<div class="flex flex-row">
			<twitch-main-page-card class="flex-grow-1" style="flex-basis: 0" />
			<div class="flex-grow-1" style="flex-basis: 0"></div>
		</div>
	</flex-scroller>
</template>

<script setup lang="ts">
import { useResourceArray, FlexScroller } from "castmate-ui-core"

import { TwitchMainPageCard } from "castmate-plugin-twitch-renderer"

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
