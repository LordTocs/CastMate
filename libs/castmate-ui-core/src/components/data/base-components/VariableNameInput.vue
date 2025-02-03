<template>
	<p-input-text
		v-model="editValue"
		@focus="onFocus"
		@blur="onBlur"
		:class="{ 'p-invalid': !isValid }"
		ref="varInput"
	/>
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import { computed, onBeforeUnmount, onMounted, ref, useModel, watch } from "vue"
import { isValidJSName } from "castmate-schema"
import { useDataBinding, useDataUIBinding, useTextUndoCommitter } from "../../../main"

const props = defineProps<{
	modelValue: string | undefined
	localPath: string
}>()

useDataBinding(() => props.localPath)

const emit = defineEmits(["update:modelValue"])

const editValue = ref<string>()

const isValid = computed(() => {
	return editValue.value == null || isValidJSName(editValue.value)
})

function onFocus(ev: FocusEvent) {
	editValue.value = props.modelValue
}

const model = useModel(props, "modelValue")

function emitValue() {
	if (editValue.value != props.modelValue && (!editValue.value || isValidJSName(editValue.value))) {
		model.value = editValue.value
	}
}

function onBlur(ev: FocusEvent) {
	emitValue()
}

onMounted(() => {
	watch(editValue, () => {
		emitValue()
	})

	watch(
		() => props.modelValue,
		() => {
			editValue.value = props.modelValue
		},
		{ immediate: true }
	)
})

onBeforeUnmount(() => {
	emitValue()
})

const varInput = ref<{ $el: HTMLElement }>()

useTextUndoCommitter(() => varInput.value?.$el)

useDataUIBinding({
	focus() {
		varInput.value?.$el.focus()
	},
	scrollIntoView() {
		varInput.value?.$el.scrollIntoView()
	},
})
</script>
