<template>
	<span class="p-float-label" v-if="!noFloat">
		<slot :placeholder="undefined" :input-id="inputId"> </slot>
		<label :for="inputId"> {{ label }}</label>
	</span>
	<slot v-else :placeholder="label" :input-id="inputId"> </slot>
</template>

<script setup lang="ts">
const props = defineProps<{
	noFloat?: boolean
	label?: string
	inputId: string
}>()
</script>
