<template>
	<div class="fill action-component flex flex-column align-items-center justify-content-center">
		<template v-if="displayData">
			<p-avatar :image="displayData.profilePicture" shape="circle"></p-avatar>
			{{ displayData.displayName }}
		</template>
		<template v-else>
			{{ model.streamer }}
		</template>
	</div>
</template>

<script setup lang="ts">
import { computedAsync } from "@vueuse/core"
import { TwitchViewerUnresolved } from "castmate-plugin-twitch-shared"
import { useViewerStore } from "../../util/viewer"
import PAvatar from "primevue/avatar"
import { defaultStringIsTemplate } from "castmate-ui-core"

const model = defineModel<{
	streamer: TwitchViewerUnresolved | undefined
}>({ required: true })

const viewerStore = useViewerStore()

const displayData = computedAsync(async () => {
	if (!model.value.streamer) return undefined
	if (defaultStringIsTemplate(model.value.streamer)) return undefined
	return await viewerStore.getUserById(model.value.streamer)
})
</script>

<style scoped>
.action-component {
	font-size: 0.7rem;
	padding: 0 0.25rem;
}

.fill {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	top: 0;
}
</style>
