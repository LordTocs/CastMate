<template>
	<div
		class="p-inputwrapper input-box"
		:class="{
			'p-filled': model != null,
			'p-focused': focused,
			'p-inputwrapper-filled': model != null,
			'p-inputwrapper-focused': focused,
			'p-invalid': errorMessage,
			'p-inputwrapper-invalid': errorMessage,
			'p-disabled': disabled == true,
		}"
	>
		<div
			class="p-inputtext p-component input-box-internal"
			:class="{ 'focus-outline': focused, 'no-left-bezel': !bezelLeft, 'no-right-bezel': !bezelRight }"
			:tabindex="tabIndex"
			style="width: unset; max-width: 100%"
			@focus="$emit('focus', $event)"
			@blur="$emit('blur', $event)"
			@click="$emit('click', $event)"
			ref="inputDiv"
		>
			<slot name="always-render" :inputDiv="inputDiv"></slot>
			<slot v-if="((model != null && model !== '') || focused) && inputDiv" :input-div="inputDiv">
				<span class="model-span">{{ model }}</span>
			</slot>
			<span v-else-if="placeholder">{{ placeholder }}</span>
			<span v-else>&nbsp;</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"

const props = withDefaults(
	defineProps<{
		model: any
		focused?: boolean
		placeholder?: string
		tabIndex?: number
		bezelLeft?: boolean
		bezelRight?: boolean
		errorMessage?: string
		disabled?: boolean
	}>(),
	{
		bezelLeft: true,
		bezelRight: true,
	}
)

const inputDiv = ref<HTMLElement>()

defineEmits(["blur", "focus", "click"])

defineExpose({
	inputDiv,
})
</script>

<style scoped>
.focus-outline {
	outline: 0 none;
	outline-offset: 0;
	/* box-shadow: 0 0 0 1px #e9aaff; */
	border-color: #c9b1cb;
}

.input-box-internal:hover {
	border-color: var(--p-primary-color);
}

.input-box {
	width: 0;
	flex: 1;
}

.model-span {
	white-space: nowrap;
}

.input-box-internal {
	overflow-x: hidden;
}
</style>
