<template>
	<data-input-base v-model="model" :schema="schema" v-slot="inputProps">
		<duration-field v-model="model" :required="schema.required" v-bind="inputProps" />
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import { Duration } from "castmate-schema"
import { TemplateToggle, stopEvent } from "../../../main"
import { SchemaDuration } from "castmate-schema"
import DurationField from "../base-components/DurationField.vue"

import PButton from "primevue/button"
import { ref, useModel } from "vue"
import { SharedDataInputProps } from "../DataInputTypes"
import LabelFloater from "../base-components/LabelFloater.vue"

const props = defineProps<
	{
		modelValue: Duration | undefined
		schema: SchemaDuration
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const templateMode = ref(false)

function clear() {
	model.value = undefined
}

function toggleTemplate() {
	if (!props.schema.template) {
		return
	}

	templateMode.value = !templateMode.value
}
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
