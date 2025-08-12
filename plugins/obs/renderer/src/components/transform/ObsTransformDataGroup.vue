<template>
	<div class="data-transform-group">
		<div class="data-group-header">
			{{ label }}
		</div>
		<slot name="before"></slot>
		<div :class="innerClass">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useDataBinding } from "castmate-ui-core"
import { StyleValue } from "vue"

const props = defineProps<{
	label?: string
	modelValue: object | undefined
	innerClass?: any
	localPath: string
}>()

useDataBinding(() => props.localPath)
</script>

<style scoped>
.data-transform-group {
	/* padding: 0.5rem; */
	margin-top: 1rem;
	border: solid 1px var(--surface-100);
	border-radius: var(--border-radius);
}
</style>
