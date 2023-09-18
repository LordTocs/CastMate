<template>
	<twitch-viewer-group-rule-group v-model="model" v-if="'or' in model || 'and' in model" />
</template>

<script setup lang="ts">
import { useModel } from "vue"
import TwitchViewerGroupRuleGroup from "./TwitchViewerGroupRuleGroup.vue"
import { TwitchViewerGroupRule } from "castmate-plugin-twitch-shared"

const props = defineProps<{
	modelValue: TwitchViewerGroupRule
}>()

const model = useModel(props, "modelValue")
</script>

<style scoped></style>
