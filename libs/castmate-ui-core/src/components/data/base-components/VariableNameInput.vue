<template>
	<p-input-text v-model="editValue" @focus="onFocus" @blur="onBlur" :class="{ 'p-invalid': !isValid }" />
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { isValidJSName } from "castmate-schema"

const props = defineProps<{
	modelValue: string | undefined
}>()

const emit = defineEmits(["update:modelValue"])

const editValue = ref<string>()

const isValid = computed(() => {
	return editValue.value == null || isValidJSName(editValue.value)
})

function onFocus(ev: FocusEvent) {
	editValue.value = props.modelValue
}

function emitValue() {
	if (editValue.value != props.modelValue && (!editValue.value || isValidJSName(editValue.value))) {
		emit("update:modelValue", editValue.value)
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
</script>
