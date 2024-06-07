<template>
	<p-button class="flex-none" icon="pi pi-times" @click="clear" />
</template>

<script setup lang="ts">
import PButton from "primevue/button"
import { useModel } from "vue"
const props = defineProps<{
	modelValue: any
}>()

const model = useModel(props, "modelValue")

function clear() {
	model.value = undefined
}
</script>
