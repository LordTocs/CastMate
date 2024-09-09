<template>
	<span class="data-label" v-if="schema.name">{{ schema.name }}:</span>
	<span class="inline-flex vertical-align-middle flex-row align-items-center" v-if="viewerDisplayData">
		<img class="twitch-avatar" :src="viewerDisplayData.profilePicture" />
		<span :style="{ color: viewerDisplayData.color }"> {{ viewerDisplayData.displayName }}</span>
	</span>
	<span class="inline-flex vertical-align-middle flex-row align-items-center" v-else> {{ modelValue }}</span>
</template>

<script setup lang="ts">
import { SchemaTwitchViewer, TwitchViewer, TwitchViewerUnresolved } from "castmate-plugin-twitch-shared"
import { defaultStringIsTemplate, SharedDataViewProps } from "castmate-ui-core"
import { useViewerStore } from "../../util/viewer"
import { computedAsync } from "@vueuse/core"

const props = defineProps<
	{
		modelValue: TwitchViewerUnresolved | undefined
		schema: SchemaTwitchViewer
	} & SharedDataViewProps
>()

const viewerStore = useViewerStore()

const viewerDisplayData = computedAsync(async () => {
	if (!props.modelValue) return undefined
	if (defaultStringIsTemplate(props.modelValue)) return undefined
	return await viewerStore.getUserById(props.modelValue)
})
</script>

<style scoped>
.twitch-avatar {
	display: inline-block;
	height: 1em;
	margin-right: 0.5em;
}
</style>
