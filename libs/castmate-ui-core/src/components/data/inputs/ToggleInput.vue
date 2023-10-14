<template>
	<document-path :local-path="localPath">
		<div class="p-inputgroup" v-bind="$attrs">
			<toggle-switch
				input-id="switch"
				v-model="model"
				:true-icon="schema.trueIcon"
				:false-icon="schema.falseIcon"
				:toggle-icon="schema.toggleIcon"
			/>
			<label for="switch" class="ml-2" v-if="schema.name"> {{ schema.name }} </label>
		</div>
	</document-path>
</template>

<script setup lang="ts">
import { Toggle } from "castmate-schema"
import { useModel } from "vue"
import DocumentPath from "../../document/DocumentPath.vue"
import ToggleSwitch from "../base-components/ToggleSwitch.vue"
import { SchemaToggle } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"

const props = defineProps<
	{
		modelValue: Toggle
		schema: SchemaToggle
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")
</script>

<style scoped>
.data-prop {
	margin-top: 0.5rem !important;
}

.data-prop:nth-child(1) {
	margin-top: 0 !important;
}
</style>
