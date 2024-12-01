<template>
	<float-label v-if="!noFloat">
		<slot :placeholder="undefined" :input-id="inputId"> </slot>
		<label :for="inputId"> <i v-if="icon" :class="icon" /> {{ label }}</label>
	</float-label>
	<slot v-else :placeholder="label" :input-id="inputId" v-bind="$attrs"> </slot>
</template>

<script setup lang="ts">
import { FloatLabel } from "primevue"

const props = defineProps<{
	noFloat?: boolean
	label?: string
	inputId?: string
	icon?: string
}>()
</script>

<style scoped></style>
