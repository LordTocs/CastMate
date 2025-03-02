<template>
	<p-input-text v-model="model" ref="textInput" />
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import { useDataBinding, useDataUIBinding, useTextUndoCommitter } from "../../../main"
import { ref } from "vue"

const props = defineProps<{
	localPath?: string
}>()

useDataBinding(() => props.localPath)

const model = defineModel<string>()

const textInput = ref<InstanceType<typeof PInputText> & { $el: HTMLElement }>()

useTextUndoCommitter(() => textInput.value?.$el)

useDataUIBinding({
	focus() {
		textInput.value?.$el.focus()
	},
	scrollIntoView() {
		textInput.value?.$el.scrollIntoView()
	},
})
</script>

<style scoped></style>
