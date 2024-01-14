<template>
	<div :style="{ ...actionColorStyle }" class="mini-icon">
		<i :class="action?.icon ?? 'mdi mdi-star'" />
	</div>
</template>

<script setup lang="ts">
import { AnyAction } from "castmate-schema"
import { ActionSelection, useAction, useActionColors } from "../../../main"
import { ActionStack } from "castmate-schema"
import { computed } from "vue"
import { isActionStack } from "castmate-schema"

const props = defineProps<{
	action: AnyAction | ActionStack | undefined
}>()

const highlightAction = computed(() => {
	if (!props.action) return undefined

	if (isActionStack(props.action)) {
		return props.action.stack[0]
	}

	return props.action
})

const action = useAction(highlightAction)
const { actionColorStyle } = useActionColors(highlightAction)
</script>

<style scoped>
.mini-icon {
	border-radius: var(--border-radius);
	height: 1.5em;
	width: 1.5em;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--action-color);
}
</style>
