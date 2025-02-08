<template>
	<p-select-button v-model="undoModel" :options="options">
		<template #option="slotProps" v-if="$slots.option">
			<slot name="option" v-bind="slotProps"></slot>
		</template>
	</p-select-button>
</template>

<script setup lang="ts">
import PSelectButton from "primevue/selectbutton"
import { useDataBinding, useUndoCommitter } from "../../../main"

const props = defineProps<{
	localPath?: string
	options: string[]
}>()

const model = defineModel<string>()
const undoModel = useUndoCommitter(model)

useDataBinding(() => props.localPath)
</script>
