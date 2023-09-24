<template>
	<div
		class="p-inputwrapper"
		:class="{
			'p-inputwrapper-filled': model != null,
			'p-inputwrapper-focused': focused,
		}"
	>
		<div class="p-inputtext w-full">
			<slot v-if="model"> {{ model }} </slot>
			<span v-else> {{ placeholder ?? "&nbsp;" }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	model: any
	focused?: boolean
	placeholder?: string
}>()
</script>
