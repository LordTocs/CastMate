<template>
	<div class="channelpoint-preview">
		<div class="channelpoint-block" :style="{ backgroundColor: reward.state.rewardData?.backgroundColor }">
			<img
				class="channelpoint-img"
				src="https://static-cdn.jtvnw.net/custom-reward-images/default-2.png"
				v-if="!reward.state.image"
			/>
			<img class="channelpoint-img" :src="reward.state.image" v-else />
			<div class="channelpoint-cost">
				<i class="twi twi-channel-points"></i>
				{{ reward.state.rewardData?.cost }}
			</div>
		</div>
		<div class="channelpoint-name">
			{{ reward.state.rewardData?.title }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { ChannelPointRewardConfig, ChannelPointRewardState } from "castmate-plugin-twitch-shared"
import { ResourceData } from "castmate-schema"
type ChannelPointResource = ResourceData<ChannelPointRewardConfig, ChannelPointRewardState>
const props = defineProps<{
	reward: ChannelPointResource
}>()
</script>

<style scoped>
.channelpoint-preview {
	width: 93px;
}
.channelpoint-block {
	width: 93px;
	height: 93px;
	border-radius: 0.4rem;
	background-color: grey;

	display: flex;
	flex-direction: column;
	align-items: center;

	position: relative;
}

.channelpoint-img {
	width: 24px;
	height: 24px;
	margin-top: 34px;
}

.channelpoint-cost {
	background-color: rgba(0, 0, 0, 0.35);
	line-height: 15px;
	font-size: 12px;
	padding: 5px;
}

.channelpoint-name {
	font-family: "Inter", "Roobert", "Helvetica Neue", Helvetica, Arial, sans-serif;
	font-size: 12px;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	padding-top: 5px;
}
</style>
