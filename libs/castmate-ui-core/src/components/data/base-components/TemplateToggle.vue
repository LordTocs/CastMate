<template>
	<template v-if="templateMode">
		<p-icon-field class="w-full" v-bind="$attrs" ref="container">
			<p-input-text
				v-if="!props.multiLine"
				class="w-full"
				style="z-index: inherit"
				v-model="model"
				:disabled="disabled"
				ref="inputText"
			/>
			<p-text-area
				class="w-full"
				style="z-index: inherit"
				v-model="model"
				:disabled="disabled"
				autoResize
				ref="textArea"
				v-else
			/>
			<p-input-icon class="mdi mdi-code-json" @click="suggestionClick" @mousedown="stopPropagation" />
		</p-icon-field>
		<!-- <p-button class="flex-none no-focus-highlight" icon="mdi mdi-code-json" size="small" text /> -->
	</template>
	<slot v-else v-bind="$attrs" :input-id="inputId"> </slot>
	<state-suggestion-panel :container="dropAnchor" v-model:open="suggestionVisible" @suggest="onSuggest" />
</template>

<script setup lang="ts">
import { computed, ref, useModel } from "vue"
import PInputText from "primevue/inputtext"
import PTextArea from "primevue/textarea"
import PIconField from "primevue/iconfield"
import PInputIcon from "primevue/inputicon"
import PBaseComponent from "@primevue/core/basecomponent"

import StateSuggestionPanel from "./state/StateSuggestionPanel.vue"
import { useDataUIBinding, usePropagationStop } from "../../../main"
import { VueInstance } from "@vueuse/core"

const props = defineProps<{
	modelValue: any | string | undefined
	templateMode?: boolean
	inputId?: string
	noRightBezel?: boolean
	errorMessage?: string
	disabled?: boolean
	multiLine?: boolean
}>()

const container = ref<InstanceType<typeof PIconField>>()
const dropAnchor = computed(() => {
	if (!container.value) return undefined
	return (container.value as unknown as VueInstance).$el as HTMLElement
})

const suggestionVisible = ref(false)
const emit = defineEmits(["update:modelValue"])

//Some bug in typescript incorrectly infered our model type
const model = useModel(props, "modelValue")

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

const textArea = ref<InstanceType<typeof PTextArea> & { $el: HTMLElement }>()
const inputText = ref<InstanceType<typeof PInputText> & { $el: HTMLElement }>()

function focus() {
	textArea.value?.$el.focus()
	inputText.value?.$el.focus()
}

function scrollIntoView() {
	textArea.value?.$el.scrollIntoView()
	inputText.value?.$el.scrollIntoView()
}

useDataUIBinding({
	focus,
	scrollIntoView,
})

defineExpose({
	focus,
	scrollIntoView,
})
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
</style>
