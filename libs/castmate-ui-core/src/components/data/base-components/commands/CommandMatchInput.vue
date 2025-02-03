<template>
	<label-floater :label="label" input-id="match" v-slot="labelProps">
		<p-input-text v-model="model" v-bind="labelProps" style="width: 100%" ref="matchInput" />
	</label-floater>
</template>

<script setup lang="ts">
import { ref } from "vue"
import {
	LabelFloater,
	useDataBinding,
	useDataUIBinding,
	useTextUndoCommitter,
	useUndoCommitter,
} from "../../../../main"
import PInputText from "primevue/inputtext"

const model = defineModel<string>()

useDataBinding("match")

const props = defineProps<{
	label?: string
}>()

const matchInput = ref<{ $el: HTMLElement }>()

useTextUndoCommitter(() => matchInput.value?.$el)

useDataUIBinding({
	focus() {
		matchInput.value?.$el?.focus()
	},
	scrollIntoView() {
		matchInput.value?.$el?.scrollIntoView()
	},
})
</script>

<style scoped></style>
