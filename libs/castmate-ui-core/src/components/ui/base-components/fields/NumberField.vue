<template>
	<p-input-text
		v-model="bufferedNumModel"
		v-keyfilter="/[\d-.]|Enter/"
		@focus="onFocus"
		@blur="onBlur"
		:placeholder="placeholder"
		ref="numInput"
		:suffix="suffix"
		:size="size"
	/>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue"
import { useDataUIBinding } from "../../../../editor/data-binding"

import PInputText from "primevue/inputtext"
import { useCommitUndo, useFocusWatcher, useTextSelectionWatcher } from "../../../../main"

const model = defineModel<number>()

const props = withDefaults(
	defineProps<{
		min?: number
		max?: number
		step?: number
		placeholder?: string
		suffix?: string
		showButtons?: boolean
		allowEmpty?: boolean
		size?: "small" | "large"
	}>(),
	{
		allowEmpty: true,
	}
)

const numInput = ref<InstanceType<typeof PInputText> & { $el: HTMLInputElement }>()

const numEditModel = ref("")

const focused = ref(false)

defineExpose({
	focus() {
		numInput.value?.$el.focus()
	},
	scrollIntoView() {
		numInput.value?.$el.scrollIntoView()
	},
})

useDataUIBinding({
	focus() {
		numInput.value?.$el.focus()
	},
	scrollIntoView() {
		numInput.value?.$el.scrollIntoView()
	},
})

onMounted(() => {
	watch(
		model,
		() => {
			if (model.value != null) {
				numEditModel.value = String(model.value)
			} else {
				numEditModel.value = ""
			}
		},
		{ immediate: true }
	)
})

useFocusWatcher(() => numInput.value?.$el)
useTextSelectionWatcher(() => numInput.value?.$el)

const hasChanged = ref(false)

//Allows the person editing the input to fumble the keys or backspace a number into an invalid state without the input rounding/collapsing around it
//If the value they typed is a valid number, we apply it immediately otherwise we let them continue editing the invalid string
//If the user leaves an invalid number string we resolve it in OnBlur()
const bufferedNumModel = computed<string | undefined>({
	get() {
		return numEditModel.value
	},
	set(v) {
		if (v) {
			numEditModel.value = v
			const num = Number(v)
			if (!isNaN(num)) {
				model.value = clampAndRoundNum(num)
				hasChanged.value = true
			}
		} else {
			const emptyValue = props.allowEmpty ? undefined : Math.max(0, props.min ?? 0)
			//console.log("Setting Empty Value", emptyValue)
			model.value = emptyValue
			hasChanged.value = true
		}
	},
})

function roundToStep(value: number, step: number) {
	return Math.round(value / step) * step
}

function clampAndRoundNum(num: number) {
	if (props.step != null) {
		num = roundToStep(num, props.step)
	}

	if (props.max != null) {
		num = Math.min(num, props.max)
	}

	if (props.min != null) {
		num = Math.max(num, props.min)
	}

	return num
}

const commitUndo = useCommitUndo()

function onFocus() {
	focused.value = true
	hasChanged.value = false
}

function onBlur() {
	console.log("Bluring Num!")
	focused.value = false

	if (!numEditModel.value) {
		console.log("EMPY?")
		model.value = props.allowEmpty ? undefined : Math.max(0, props.min ?? 0)
		commitUndo()
		return
	}

	const num = Number(numEditModel.value)
	if (isNaN(num)) {
		console.log("NAN DETECTED!", numEditModel.value, num)
		numEditModel.value = model.value != null ? String(model.value) : ""
	} else {
		let finalNum = clampAndRoundNum(num)

		if (finalNum != model.value) {
			console.log("Resolving num to", finalNum)
			model.value = finalNum
			commitUndo()
		} else if (hasChanged) {
			//Handle the case where the model.value already matches our parsed number but we need to issue a undo commit since it changed during this focus session.
			commitUndo()
			hasChanged.value = false
		}
	}
}
</script>

<style scoped></style>
