<template>
	<div
		class="p-inputwrapper"
		:class="{
			'p-filled': model != null,
			'p-focused': focused,
			'p-inputwrapper-filled': model != null,
			'p-inputwrapper-focused': focused,
		}"
	>
		<div class="p-inputtext p-component w-full" :class="{ 'focus-outline': focused }">
			<slot v-if="model"> {{ model }} </slot>
			<span v-else> {{ placeholder ?? "&nbsp;" }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted } from "vue"

const props = defineProps<{
	model: any
	focused?: boolean
	placeholder?: string
}>()

onMounted(() => {
	console.log("Mount Input")
})
</script>

<style scoped>
.focus-outline {
	outline: 0 none;
	outline-offset: 0;
	/* box-shadow: 0 0 0 1px #e9aaff; */
	border-color: #c9b1cb;
}
</style>
