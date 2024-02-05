<template>
	<div class="return-namer">
		<div v-for="kn in returnNames" :key="kn.key" class="mt-4">
			<label-floater :label="kn.name" :input-id="kn.key" v-slot="labelProps">
				<variable-name-input
					class="w-full"
					v-bind="labelProps"
					:model-value="getReturnMapping(kn.key)"
					@update:model-value="(v) => setReturnMapping(kn.key, v)"
				/>
			</label-floater>
		</div>
	</div>
</template>

<script setup lang="ts">
import { SchemaObj } from "castmate-schema"
import { computed, useModel } from "vue"
import VariableNameInput from "../base-components/VariableNameInput.vue"
import LabelFloater from "../base-components/LabelFloater.vue"

const props = defineProps<{
	modelValue: Record<string, string> | undefined
	resultSchema: SchemaObj
}>()

interface ReturnNamePair {
	key: string
	name: string
}

const model = useModel(props, "modelValue")

const returnNames = computed<ReturnNamePair[]>(() => {
	return Object.keys(props.resultSchema.properties).map((key) => ({
		key,
		name: props.resultSchema.properties[key].name ?? key,
	}))
})

function getReturnMapping(key: string): string | undefined {
	return props.modelValue?.[key]
}

function setReturnMapping(key: string, value: string | undefined) {
	if (value == "") {
		value = undefined
	}

	if (value == undefined && model.value != null) {
		delete model.value[key]
	} else if (value != null && model.value != null) {
		model.value[key] = value
	} else if (value != null) {
		model.value = { [key]: value }
	}
}
</script>

<style scoped>
.return-namer {
	padding: 0.5rem;
	margin: 0.5rem;
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
}
</style>
