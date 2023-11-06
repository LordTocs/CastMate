<template>
	<div class="p-inputgroup" @mousedown="stopEvent">
		<label-floater :no-float="noFloat" :label="schema.name" input-id="duration" v-slot="labelProps">
			<template-toggle v-model="model" :template-mode="templateMode" v-bind="labelProps" v-slot="templateProps">
				<duration-field v-model="model" :required="schema.required" v-bind="templateProps" />
			</template-toggle>
		</label-floater>
		<p-button
			class="flex-none no-focus-highlight"
			v-if="schema.template"
			icon="mdi mdi-code-braces"
			@click="toggleTemplate"
		/>
		<p-button class="flex-none" v-if="!schema.required" icon="pi pi-times" @click.stop="clear" />
	</div>
</template>

<script setup lang="ts">
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
