<template>
	<data-input-base v-model="model" :schema="schema" v-slot="inputProps" :local-path="localPath">
		<duration-field
			v-model="model"
			:required="SchemaMeta.isRequired(schema)"
			v-bind="inputProps"
			ref="durationInput"
		/>
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import { Duration, SchemaMeta } from "castmate-schema"
import { SchemaDuration } from "castmate-schema"
import DurationField from "../../ui/base-components/fields/DurationField.vue"
import { ref, useModel } from "vue"
import { SharedDataInputProps } from "../DataInputTypes"
import { useDataBinding, useDataUIBinding } from "../../../editor/data-binding.ts"

const props = defineProps<
	{
		modelValue: Duration | undefined
		schema: SchemaDuration
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const durationInput = ref<InstanceType<typeof DurationField>>()

useDataUIBinding({
	focus() {
		durationInput.value?.focus()
	},
	scrollIntoView() {
		durationInput.value?.scrollIntoView()
	},
})

defineExpose({
	focus() {
		durationInput.value?.focus()
	},
	scrollIntoView() {
		durationInput.value?.scrollIntoView()
	},
})
</script>

<style scoped>
.forced-focus {
	outline: 0 none;
	outline-offset: 0;
	box-shadow: 0 0 0 1px #e9aaff;
	border-color: #c9b1cb;
}

.duration-input {
	cursor: text;
}

.prop-up {
	display: inline-block;
	height: 1em;
	width: 0;
}
</style>
