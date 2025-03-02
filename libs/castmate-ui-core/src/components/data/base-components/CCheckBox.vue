<template>
	<p-check-box binary v-model="undoModel" ref="checkBox" :input-id="localPath" />
</template>

<script setup lang="ts">
import PCheckBox from "primevue/checkbox"
import { useDataBinding, useDataUIBinding, useUndoCommitter } from "../../../main"
import { ref } from "vue"

const model = defineModel<boolean>()

const props = defineProps<{
	localPath: string
}>()

useDataBinding(() => props.localPath)

const undoModel = useUndoCommitter(model)

const checkBox = ref<InstanceType<typeof PCheckBox> & { $el: HTMLElement }>()

useDataUIBinding({
	focus() {
		checkBox.value?.$el.focus()
	},
	scrollIntoView() {
		checkBox.value?.$el.scrollIntoView()
	},
})
</script>
