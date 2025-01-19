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
		ref="container"
		v-bind="$attrs"
		@click="onMousedown"
	>
		<div
			class="p-inputtext p-component input-box-internal"
			:class="{ 'focus-outline': focused }"
			:tabindex="tabIndex"
			style="width: 100%"
			@focus="onFocus"
			ref="inputDiv"
			v-if="!focused"
		>
			<slot v-if="model != null && model !== '' && inputDiv" :input-div="inputDiv">
				<span class="model-span">{{ model }}</span>
			</slot>
			<span v-else-if="placeholder">{{ placeholder }}</span>
			<span v-else>&nbsp;</span>
		</div>
		<p-input-text
			v-else
			@blur="onBlur"
			ref="filterInputElement"
			:tabindex="tabIndex"
			style="width: 100%"
			v-model="filter"
			@keydown="onFilterKeyDown"
			:placeholder="placeholder"
			:disabled="disabled"
		/>
	</div>
	<slot name="append" :anchor="container" :filter="filter"> </slot>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useModel } from "vue"

import PInputText from "primevue/inputtext"
import { useDataUIBinding, usePropagationStop } from "../../../main"

const props = withDefaults(
	defineProps<{
		placeholder?: string
		tabIndex?: number
		errorMessage?: string
		disabled?: boolean
	}>(),
	{ tabIndex: -1 }
)

const model = defineModel<any>()
const filter = defineModel<string>("filter")
const emit = defineEmits(["update:modelValue", "update:filter", "focus", "blur", "filterKeyDown"])

const stopPropagation = usePropagationStop()
const inputDiv = ref<HTMLElement>()

////////////////////////////
//Drop Down Opening
const container = ref<HTMLElement | null>(null)

function focus() {
	focused.value = true
	nextTick(() => {
		filterInputElement.value?.$el?.focus()
	})
}

function blur() {
	filterInputElement.value?.$el?.blur()
	focused.value = false
	nextTick(() => {})
}

function scrollIntoView() {
	filterInputElement.value?.$el.scrollIntoView()
}

defineExpose({
	focus,
	blur,
	scrollIntoView,
})

useDataUIBinding({
	focus,
	scrollIntoView,
})

function onMousedown(ev: MouseEvent) {
	if (ev.button != 0) return

	ev.preventDefault()
	stopPropagation(ev)
}

//////////////////
//Filtering

const filterInputElement = ref<{ $el: HTMLElement } | null>(null)

//////

const focused = ref(false)

function onFocus(ev: FocusEvent) {
	emit("focus", ev)
	focused.value = true
	nextTick(() => {
		filterInputElement.value?.$el?.focus()
	})
}

function onBlur(ev: FocusEvent) {
	emit("blur", ev)
	focused.value = false
}

////
//Key navigation

function onFilterKeyDown(ev: KeyboardEvent) {
	emit("filterKeyDown", ev)
}
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
