<template>
	<twitch-viewer-group-rule-negator v-model="model" />
</template>

<script setup lang="ts">
import { useModel } from "vue"
import TwitchViewerGroupRuleNegator from "./TwitchViewerGroupRuleNegator.vue"
import { TwitchViewerGroupRule } from "castmate-plugin-twitch-shared"

const props = defineProps<{
	modelValue: TwitchViewerGroupRule
}>()

const model = useModel(props, "modelValue")
</script>

<style scoped></style>
