<template>
	<span v-if="viewerDisplayData">
		<img class="twitch-avatar" :src="viewerDisplayData.profilePicture" />
		<span :style="{ color: viewerDisplayData.color }"> {{ viewerDisplayData.displayName }}</span>
	</span>
</template>

<script setup lang="ts">
import { TwitchViewerUnresolved } from "castmate-plugin-twitch-shared"
import { computedAsync } from "@vueuse/core"
import { useViewerStore } from "../../util/viewer"

const props = defineProps<{
	viewer: TwitchViewerUnresolved | undefined
}>()

const viewerStore = useViewerStore()

const viewerDisplayData = computedAsync(async () => {
	if (!props.viewer) return undefined
	return await viewerStore.getUserById(props.viewer)
})
</script>

<style scoped>
.twitch-avatar {
	display: inline-block;
	height: 1em;
	margin-right: 0.5em;
}
</style>
