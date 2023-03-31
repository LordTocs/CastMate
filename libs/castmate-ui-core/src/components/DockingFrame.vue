<template>
	<div></div>
</template>

<script setup>
import { useVModel } from "@vueuse/core"

const props = defineProps({
	modelValue: {},
})
const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)
</script>
