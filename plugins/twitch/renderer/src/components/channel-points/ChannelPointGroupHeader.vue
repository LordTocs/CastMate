<template>
	<li class="header text-center mb-1 pb-2" :style="{ borderBottom: `solid 2px #e6e6e6` }">
		<template v-if="item.config.controllable"> CastMate Rewards </template>
		<template v-else> Other Rewards</template>
	</li>
</template>

<script setup lang="ts">
import { ChannelPointRewardConfig } from "castmate-plugin-twitch-shared"
import { ResourceData } from "castmate-schema"

const props = defineProps<{
	item: ResourceData<ChannelPointRewardConfig>
}>()
</script>

<style scoped>
.header {
	font-weight: 600;
	color: #e6e6e6;
}
</style>
