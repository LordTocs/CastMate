<template>
	<template v-if="templateMode">
		<div
			class="p-input-password p-input-wrapper w-full"
			:class="{
				'p-filled': !!model,
				'p-focused': focused,
				'p-inputwrapper-filled': !!model,
				'p-inputwrapper-focused': focused,
				'p-invalid': errorMessage,
				'p-inputwrapper-invalid': errorMessage,
			}"
			v-bind="$attrs"
			:input-id="inputId"
			ref="container"
		>
			<p-input-text
				v-if="!props.multiLine"
				class="template-input input-icon-spacing w-full"
				:class="{ 'no-right-bezel': noRightBezel }"
				v-model="model"
				:disabled="disabled"
			/>
			<p-text-area
				class="template-input input-icon-spacing w-full"
				:class="{ 'no-right-bezel': noRightBezel }"
				v-model="model"
				:disabled="disabled"
				autoResize
				v-else
			/>
			<i class="mdi mdi-code-json input-icon" @click="suggestionClick" @mousedown="stopPropagation" />
			<state-suggestion-panel :container="container" v-model:open="suggestionVisible" @suggest="onSuggest" />
		</div>
		<!-- <p-button class="flex-none no-focus-highlight" icon="mdi mdi-code-json" size="small" text /> -->
	</template>
	<slot v-else v-bind="$attrs" :input-id="inputId"> </slot>
</template>

<script setup lang="ts" generic="T">
import { computed, ref, useModel } from "vue"
import PInputText from "primevue/inputtext"
import PTextArea from "primevue/textarea"
import StateSuggestionPanel from "./state/StateSuggestionPanel.vue"
import { usePropagationStop } from "../../../main"

const focused = ref(false)

const props = defineProps<{
	modelValue: T | string | undefined
	templateMode: boolean
	inputId?: string
	noRightBezel?: boolean
	errorMessage?: string
	disabled?: boolean
	multiLine?: boolean
}>()

const container = ref<HTMLElement>()
const suggestionVisible = ref(false)
const emit = defineEmits(["update:modelValue"])

//Some bug in typescript incorrectly infered our model type
//const model = useModel<any>(props, "modelValue")

const model = computed<any>({
	get() {
		return props.modelValue
	},
	set(v) {
		emit("update:modelValue", v)
	},
})

const stopPropagation = usePropagationStop()

function suggestionClick(ev: MouseEvent) {
	stopPropagation(ev)
	ev.preventDefault()
	suggestionVisible.value = true
}

function isString(obj: any): obj is string {
	return typeof obj == "string"
}

function onSuggest(suggestion: string) {
	const suggestionTemplate = `{{ ${suggestion} }}`
	const currentValue = model.value

	if (currentValue != null && isString(currentValue)) {
		model.value += suggestionTemplate
	} else {
		model.value = suggestionTemplate
	}
}
</script>

<style scoped>
.input-icon-spacing {
	padding-inline-end: calc((var(--p-form-field-padding-x) * 2) + var(--p-icon-size));
}

.input-icon {
	inset-inline-end: var(--p-form-field-padding-x);
	color: #b3b3b3;
	position: absolute;
	top: 50%;
	margin-top: calc(-1 * calc(var(--p-icon-size) / 2));
	width: var(--p-icon-size);
	height: var(--p-icon-size);
}

.template-input {
	/* width: unset !important; */
}
</style>
