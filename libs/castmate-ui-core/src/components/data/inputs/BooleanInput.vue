<template>
	<p-input-group v-bind="$attrs">
		<p-check-box binary input-id="check" v-model="undoModel" ref="checkBox" />
		<label for="check" class="ml-2" v-if="schema.name"> {{ schema.name }} </label>
	</p-input-group>
</template>

<script setup lang="ts">
import { SchemaBoolean } from "castmate-schema"
import DataBindingPath from "../binding/DataBindingPath.vue"
import PCheckBox from "primevue/checkbox"
import PInputGroup from "primevue/inputgroup"
import { ref, useModel } from "vue"
import { SharedDataInputProps } from "../DataInputTypes"
import { useDataBinding, useDataUIBinding, useUndoCommitter } from "../../../util/data-binding"

const props = defineProps<
	{
		modelValue: boolean
		schema: SchemaBoolean
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

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

<style scoped>
.data-prop {
	margin-top: 0.5rem !important;
}

.data-prop:nth-child(1) {
	margin-top: 0 !important;
}
</style>
