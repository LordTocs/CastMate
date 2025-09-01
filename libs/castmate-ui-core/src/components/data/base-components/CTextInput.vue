<template>
	<p-input-text v-if="!multiLine" v-model="model" ref="textInput" :fluid="fluid" :placeholder="placeholder" />
	<p-text-area
		v-else
		v-model="model"
		ref="textAreaInput"
		auto-resize
		:fluid="fluid"
		:placeholder="placeholder"
		rows="1"
	/>
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import PTextArea from "primevue/textarea"
import { useDataBinding, useDataUIBinding, useTextUndoCommitter } from "../../../main"
import { ref } from "vue"

const props = defineProps<{
	localPath?: string
	multiLine?: boolean
	fluid?: boolean
	placeholder?: string
}>()

useDataBinding(() => props.localPath)

const model = defineModel<string>()

const textInput = ref<InstanceType<typeof PInputText> & { $el: HTMLElement }>()
const textAreaInput = ref<InstanceType<typeof PInputText> & { $el: HTMLElement }>()

useTextUndoCommitter(() => textInput.value?.$el ?? textAreaInput.value?.$el)

useDataUIBinding({
	focus() {
		textInput.value?.$el.focus()
		textAreaInput.value?.$el.focus()
	},
	scrollIntoView() {
		textInput.value?.$el.scrollIntoView()
		textAreaInput.value?.$el.focus()
	},
})
</script>

<style scoped></style>
