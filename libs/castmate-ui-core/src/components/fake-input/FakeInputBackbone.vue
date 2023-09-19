<template>
	<input
		ref="hiddenInput"
		type="text"
		v-model="model"
		@focus="onFocus"
		@blur="onBlur"
		:pattern="`\\d*`"
		class="hidden-input"
	/>
</template>

<script setup lang="ts">
import { useEventListener } from "@vueuse/core"
import { useModel, ref, watch, toValue } from "vue"
import { InputSelection } from "./FakeInputTypes.ts"

const props = defineProps<{
	modelValue: string
	selection: InputSelection
	focused: boolean
	pattern?: string
}>()

const hiddenInput = ref<HTMLInputElement | null>(null)

const model = useModel(props, "modelValue")
const selection = useModel(props, "selection")
const focused = useModel(props, "focused")

const emit = defineEmits(["blur", "update:modelValue", "update:selection", "update:focused"])

function onFocus() {
	focused.value = true
	updateSelection()
}

function onBlur(ev: FocusEvent) {
	focused.value = false
	selection.value.start = null
	selection.value.end = null
	emit("blur", ev)
}

function updateSelection() {
	selection.value.start = hiddenInput.value?.selectionStart ?? null
	selection.value.end = hiddenInput.value?.selectionEnd ?? null
	selection.value.direction = hiddenInput.value?.selectionDirection ?? null
}

useEventListener(
	() => (focused.value ? window.document : null),
	"selectionchange",
	() => {
		updateSelection()
	}
)

watch(
	() => props.modelValue,
	() => {
		if (focused.value) {
			updateSelection()
		}
	}
)

defineExpose({
	focus() {
		hiddenInput.value?.focus()
	},
	selectChars(begin: number | null, end: number | null) {
		hiddenInput.value?.setSelectionRange(begin, end, "forward")
		updateSelection()
	},
})
</script>

<style scoped>
.hidden-input {
	position: absolute;
	width: 0;
	height: 0;
	padding: 0 !important;
	border-radius: 0 !important;
	border: none !important;
}
</style>
