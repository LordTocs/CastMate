<template>
	<label-floater :label="label" :input-id="localPath" v-slot="labelProps">
		<p-select
			v-model="undoModel"
			v-bind="labelProps"
			:options="options"
			:option-value="optionValue"
			:option-label="optionLabel"
			ref="dropDown"
		/>
	</label-floater>
</template>

<script setup lang="ts">
import PSelect from "primevue/select"
import { MenuItem } from "primevue/menuitem"
import { useDataBinding, useDataUIBinding, useUndoCommitter } from "../../../main"
import LabelFloater from "./LabelFloater.vue"
import { ref } from "vue"

const model = defineModel<any>()

const props = defineProps<{
	localPath: string
	options: MenuItem[]
	label?: string
	optionValue?: string | ((data: any) => string)
	optionLabel?: string | ((data: any) => string)
}>()

useDataBinding(() => props.localPath)

const undoModel = useUndoCommitter(model)

const dropDown = ref<InstanceType<typeof PSelect> & { $el: HTMLElement }>()

useDataUIBinding({
	focus() {
		dropDown.value?.$el.focus()
	},
	scrollIntoView() {
		dropDown.value?.$el.scrollIntoView()
	},
})
</script>

<style scoped></style>
