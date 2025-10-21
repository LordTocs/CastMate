<template>
	<data-input-base
		v-model="model"
		:schema="schema"
		:no-float="noFloat"
		:toggle-template="false"
		v-slot="inputProps"
		ref="dataInputBase"
		:local-path="localPath"
	>
		<c-autocomplete
			v-model="model"
			:items="items"
			:required="schema.required ?? false"
			text-prop="name"
			v-bind="inputProps"
			ref="autocomplete"
		></c-autocomplete>
	</data-input-base>
</template>

<script setup lang="ts">
import { SchemaViewerVariableName, ViewerVariableName } from "castmate-schema"
import DataInputBase from "../base-components/DataInputBase.vue"
import EnumInput from "../base-components/EnumInput.vue"
import { SharedDataInputProps } from "../DataInputTypes"
import { useDataBinding, useDataUIBinding, useViewerDataStore } from "../../../main"
import CAutocomplete from "../base-components/CAutocomplete.vue"
import { computed, useTemplateRef } from "vue"

const props = defineProps<
	{
		schema: SchemaViewerVariableName
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = defineModel<ViewerVariableName | undefined>()

const viewerData = useViewerDataStore()

const items = computed<{ id: any; name: string }[]>(() => {
	return [...viewerData.variables.values()].map((v) => ({ id: v.name, name: v.name }))
})

const autocomplete = useTemplateRef("autocomplete")

useDataUIBinding({
	focus() {
		autocomplete.value?.focus()
	},
	scrollIntoView() {
		autocomplete.value?.scrollIntoView()
	},
})
</script>
