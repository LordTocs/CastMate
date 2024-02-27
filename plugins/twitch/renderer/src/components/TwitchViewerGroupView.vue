<template>
	<span class="data-label" v-if="schema.name">{{ schema.name }}: </span
	><twitch-viewer-group-span :group="modelValue" />
</template>

<script setup lang="ts">
import { SchemaTwitchViewerGroup, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { SharedDataViewProps } from "castmate-ui-core"
import TwitchViewerGroupSpan from "./groups/TwitchViewerGroupSpan.vue"
const props = defineProps<
	{
		modelValue: TwitchViewerGroup | undefined
		schema: SchemaTwitchViewerGroup
	} & SharedDataViewProps
>()
</script>

<style scoped></style>
