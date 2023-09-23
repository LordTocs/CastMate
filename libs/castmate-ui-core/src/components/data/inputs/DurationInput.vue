<template>
	<div class="p-inputgroup w-full" @mousedown="stopEvent">
		<label-floater :no-float="noFloat" :label="schema.name" input-id="duration" v-slot="labelProps">
			<duration-field v-model="model" :required="schema.required" v-bind="labelProps" />
		</label-floater>
		<p-button class="flex-none" v-if="!schema.required" icon="pi pi-times" @click.stop="clear" />
	</div>
</template>

<script setup lang="ts">
import { Duration } from "castmate-schema"
import { stopEvent } from "../../../main"
import { SchemaDuration } from "castmate-schema"
import DurationField from "../base-components/DurationField.vue"

import PButton from "primevue/button"
import { useModel } from "vue"
import { SharedDataInputProps } from "../DataInputTypes"
import LabelFloater from "../base-components/LabelFloater.vue"

const props = defineProps<
	{
		modelValue: Duration | undefined
		schema: SchemaDuration
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

function clear() {
	model.value = undefined
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
