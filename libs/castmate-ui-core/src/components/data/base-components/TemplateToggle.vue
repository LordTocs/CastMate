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
			<p-input-icon class="mdi mdi-code-json" @click="suggestionClick" @mousedown="onSuggestionMouseDown" />
		</p-icon-field>
	</template>
	<slot v-else v-bind="$attrs" :input-id="inputId"> </slot>
	<state-suggestion-panel :container="dropAnchor" v-model:open="suggestionVisible" @suggest="onSuggest" />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useModel } from "vue"
import PInputText from "primevue/inputtext"
import PTextArea from "primevue/textarea"
import PIconField from "primevue/iconfield"
import PInputIcon from "primevue/inputicon"

import StateSuggestionPanel from "./state/StateSuggestionPanel.vue"
import {
	useCommitUndo,
	useDataUIBinding,
	usePropagationStop,
	useTextUndoCommitter,
	useUndoCommitter,
} from "../../../main"
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
const undoModel = useUndoCommitter(model)

const commitUndo = useCommitUndo()

const stopPropagation = usePropagationStop()

function onSuggestionMouseDown(ev: MouseEvent) {
	stopPropagation(ev)
	ev.preventDefault()
}

function suggestionClick(ev: MouseEvent) {
	stopPropagation(ev)
	ev.preventDefault()
	suggestionVisible.value = true
	commitUndo()
}

function isString(obj: any): obj is string {
	return typeof obj == "string"
}

function onSuggest(suggestion: string) {
	const suggestionTemplate = `{{ ${suggestion} }}`
	const currentValue = undoModel.value

	if (currentValue != null && isString(currentValue)) {
		const selection = getSelection()

		if (selection == null) {
			undoModel.value += suggestionTemplate
		} else {
			undoModel.value =
				currentValue.slice(0, selection.start) + suggestionTemplate + currentValue.slice(selection.end)

			nextTick(() => {
				const end = selection.start + suggestionTemplate.length
				setSelection(end, end)
			})
		}
	} else {
		undoModel.value = suggestionTemplate
	}
}

const textArea = ref<InstanceType<typeof PTextArea> & { $el: HTMLInputElement }>()
const inputText = ref<InstanceType<typeof PInputText> & { $el: HTMLInputElement }>()

function getSelection() {
	const start = inputText.value?.$el?.selectionStart ?? textArea.value?.$el?.selectionStart
	const end = inputText.value?.$el?.selectionEnd ?? textArea.value?.$el?.selectionEnd

	if (start == null || end == null) {
		return undefined
	}

	return {
		start: Math.min(start, end),
		end: Math.max(start, end),
	}
}

function setSelection(start: number, end: number) {
	if (inputText.value?.$el) {
		inputText.value.$el.selectionStart = start
		inputText.value.$el.selectionEnd = end
	} else if (textArea.value?.$el) {
		textArea.value.$el.selectionStart = start
		textArea.value.$el.selectionEnd = end
	}
}

useTextUndoCommitter(() => inputText.value?.$el)
useTextUndoCommitter(() => textArea.value?.$el)

function focus() {
	textArea.value?.$el.focus()
	inputText.value?.$el.focus()
}

function scrollIntoView() {
	textArea.value?.$el.scrollIntoView()
	inputText.value?.$el.scrollIntoView()
}

useDataUIBinding(
	{
		focus,
		scrollIntoView,
	},
	"template-toggle"
)

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
