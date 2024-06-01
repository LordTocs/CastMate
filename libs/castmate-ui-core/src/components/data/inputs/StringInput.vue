<template>
	<data-input-base
		v-model="model"
		:schema="schema"
		:no-float="noFloat"
		:toggle-template="toggleTemplate"
		v-slot="inputProps"
	>
		<template-toggle
			v-model="model"
			:template-mode="!!schema.template && !toggleTemplate"
			v-bind="inputProps"
			v-slot="templateProps"
			:multi-line="schema.multiLine"
		>
			<p-password v-model="model" v-bind="templateProps" v-if="isSecret" toggle-mask :feedback="false" />
			<enum-input
				:schema="schema"
				v-model="model"
				:context="context"
				v-bind="templateProps"
				v-else-if="schema.enum"
			/>
			<p-text-area v-model="model" v-bind="templateProps" v-else-if="schema.multiLine" autoResize />
			<p-input-text v-model="model" v-bind="templateProps" v-else />
		</template-toggle>
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import PInputText from "primevue/inputtext"
import PPassword from "primevue/password"
import { type SchemaString, type SchemaBase } from "castmate-schema"
import { SharedDataInputProps, defaultStringIsTemplate } from "../DataInputTypes"
import { TemplateToggle } from "../../../main"
import EnumInput from "../base-components/EnumInput.vue"
import { computed, onMounted, ref, useModel } from "vue"
import PTextArea from "primevue/textarea"

const props = defineProps<
	{
		schema: SchemaString
		modelValue: string | undefined
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const isSecret = computed(() => props.secret || props.schema.secret)

const toggleTemplate = computed(() => {
	return props.schema.enum != null || props.secret
})
</script>
