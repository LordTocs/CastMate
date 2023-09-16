<template>
	<twitch-viewer-group-rule-group v-model="model" v-if="'or' in model || 'and' in model" />
	<twitch-viewer-group-prop-rule v-model="model" v-else-if="'property' in model" />
</template>

<script setup lang="ts">
import { useModel } from "vue"
import TwitchViewerGroupRuleGroup from "./TwitchViewerGroupRuleGroup.vue"
import TwitchViewerGroupPropRule from "./TwitchViewerGroupPropRule.vue"
import { TwitchViewerGroupRule } from "castmate-plugin-twitch-shared"

const props = defineProps<{
	modelValue: TwitchViewerGroupRule
}>()

const model = useModel(props, "modelValue")
</script>

<style scoped></style>
