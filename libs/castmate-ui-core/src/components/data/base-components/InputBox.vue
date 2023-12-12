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
		<div
			class="p-inputtext p-component"
			:class="{ 'focus-outline': focused, 'no-left-bezel': !bezelLeft, 'no-right-bezel': !bezelRight }"
			:tabindex="tabIndex"
			style="width: unset"
			@focus="$emit('focus', $event)"
			@blur="$emit('blur', $event)"
		>
			<slot v-if="model"> {{ model }} </slot>
			<span v-else-if="placeholder"> {{ placeholder }}</span>
			<span v-else>&nbsp;</span>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		model: any
		focused?: boolean
		placeholder?: string
		tabIndex?: number
		bezelLeft?: boolean
		bezelRight?: boolean
	}>(),
	{
		bezelLeft: true,
		bezelRight: true,
	}
)
</script>

<style scoped>
.focus-outline {
	outline: 0 none;
	outline-offset: 0;
	/* box-shadow: 0 0 0 1px #e9aaff; */
	border-color: #c9b1cb;
}
</style>
