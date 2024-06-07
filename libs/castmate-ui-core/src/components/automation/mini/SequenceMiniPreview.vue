<template>
	<div class="flex flex-row gap-1">
		<action-mini-icon v-for="a in truncatedActions" :id="a.id" :action="a" />
		<span v-if="sequence?.actions && sequence.actions.length > maxLength">...</span>
	</div>
</template>

<script setup lang="ts">
import { Sequence } from "castmate-schema"
import { computed } from "vue"
import ActionMiniIcon from "./ActionMiniIcon.vue"

const props = withDefaults(
	defineProps<{
		sequence: Sequence | undefined
		maxLength?: number
	}>(),
	{ maxLength: 10 }
)

const truncatedActions = computed(() => {
	if (!props.sequence?.actions) return []

	if (props.sequence.actions.length <= props.maxLength) return props.sequence.actions

	return props.sequence.actions.slice(0, props.maxLength)
})
</script>
