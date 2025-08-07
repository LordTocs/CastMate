<template>
	<p-input-text
		v-model="bufferedNumModel"
		v-keyfilter="/[\d-.]|Enter/"
		@focus="onFocus"
		@blur="onBlur"
		:placeholder="placeholder"
		ref="numInput"
		:suffix="suffix"
	/>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useCommitUndo, useDataUIBinding, useTextUndoCommitter } from "../../../util/data-binding"

import PInputText from "primevue/inputtext"

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
	}>(),
	{
		allowEmpty: true,
	}
)

const numInput = ref<InstanceType<typeof PInputText> & { $el: HTMLElement }>()

const numEditModel = ref("")

const focused = ref(false)

//useTextUndoCommitter(() => numInput.value?.$el)

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

const bufferedNumModel = computed<string | undefined>({
	get() {
		return numEditModel.value
	},
	set(v) {
		if (v) {
			numEditModel.value = v
			const num = Number(v)
			if (!isNaN(num)) {
				model.value = num
			}
		} else {
			const emptyValue = props.allowEmpty ? undefined : Math.max(0, props.min ?? 0)
			console.log("Setting Empty Value", emptyValue)
			model.value = emptyValue
		}
	},
})

function roundToStep(value: number, step: number) {
	return Math.round(value / step) * step
}

const commitUndo = useCommitUndo()

function onFocus() {
	focused.value = true
}

function onBlur() {
	focused.value = false

	if (!numEditModel.value) {
		model.value = props.allowEmpty ? undefined : Math.max(0, props.min ?? 0)
		commitUndo()
		return
	}

	const num = Number(numEditModel.value)
	if (isNaN(num)) {
		numEditModel.value = model.value != null ? String(model.value) : ""
	} else {
		let finalNum = num
		if (props.step != null) {
			finalNum = roundToStep(finalNum, props.step)
		}

		if (props.max != null) {
			finalNum = Math.min(finalNum, props.max)
		}

		if (props.min != null) {
			finalNum = Math.max(finalNum, props.min)
		}

		if (finalNum != model.value) {
			model.value = finalNum
			commitUndo()
		}
	}
}
</script>

<style scoped></style>
