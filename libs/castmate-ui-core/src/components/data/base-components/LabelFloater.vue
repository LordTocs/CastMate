<template>
	<span class="p-float-label flex-grow-1" v-if="!noFloat" style="width: unset">
		<slot :placeholder="undefined" :input-id="inputId"> </slot>
		<label :for="inputId"> <i v-if="icon" :class="icon" /> {{ label }}</label>
	</span>
	<slot v-else :placeholder="label" :input-id="inputId"> </slot>
</template>

<script setup lang="ts">
const props = defineProps<{
	noFloat?: boolean
	label?: string
	inputId: string
	icon?: string
}>()
</script>

<style scoped></style>
