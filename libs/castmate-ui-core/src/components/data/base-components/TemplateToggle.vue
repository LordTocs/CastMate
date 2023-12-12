<template>
	<template v-if="templateMode">
		<div
			class="p-password p-component p-input-wrapper p-input-icon-right flex flex-row flex-grow-1"
			:class="{
				'p-filled': model != false,
				'p-focused': focused,
				'p-inputwrapper-filled': model != false,
				'p-inputwrapper-focused': focused,
				'p-invalid': errorMessage,
				'p-inputwrapper-invalid': errorMessage,
			}"
			v-bind="$attrs"
			:input-id="inputId"
			ref="container"
		>
			<p-input-text class="flex-grow-1" :class="{ 'no-right-bezel': noRightBezel }" v-model="(model as any)" />
			<i class="mdi mdi-code-json input-icon" @click="suggestionClick" @mousedown="stopPropagation" />
			<state-suggestion-panel :container="container" v-model:open="suggestionVisible" @suggest="onSuggest" />
		</div>
		<!-- <p-button class="flex-none no-focus-highlight" icon="mdi mdi-code-json" size="small" text /> -->
	</template>
	<slot v-else v-bind="$attrs" :input-id="inputId"> </slot>
</template>

<script setup lang="ts" generic="T">
import { ref, useModel } from "vue"
import PInputText from "primevue/inputtext"
import StateSuggestionPanel from "./state/StateSuggestionPanel.vue"
import { stopPropagation } from "../../../main"
const focused = ref(false)

const props = defineProps<{
	modelValue: T | string | undefined
	templateMode: boolean
	inputId: string
	noRightBezel?: boolean
	errorMessage?: string
}>()

const container = ref<HTMLElement>()
const suggestionVisible = ref(false)

//Some bug in typescript incorrectly infered our model type
const model = useModel<
	{
		modelValue: T | string | undefined
		templateMode: boolean
		inputId: string
	},
	"modelValue"
>(props, "modelValue")

function suggestionClick(ev: MouseEvent) {
	ev.stopPropagation()
	ev.preventDefault()
	suggestionVisible.value = true
}

function isString(obj: any): obj is string {
	return typeof obj == "string"
}

function onSuggest(suggestion: string) {
	const suggestionTemplate = `{{ ${suggestion} }}`
	if (model.value != null && isString(model.value)) {
		model.value += suggestionTemplate
	} else {
		model.value = suggestionTemplate
	}
}
</script>

<style scoped>
.input-icon {
	position: absolute;
	top: 50%;
	margin-top: -0.5rem;
	right: 0.75rem;
	color: #b3b3b3;
	cursor: pointer;
}
</style>
