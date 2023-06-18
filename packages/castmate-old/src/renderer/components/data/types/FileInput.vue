<template>
	<v-input :density="density" v-model="modelObj">
		<v-field
			:label="label"
			:active="!!modelObj"
			:dirty="!!modelObj"
			:clearable="!schema?.required"
			@click:clear="doClear"
		>
			<div
				class="v-field__input"
				v-bind="props"
				style="cursor: pointer"
				@click="doSelect"
			>
				{{ modelObj }}
			</div>
		</v-field>
	</v-input>
</template>

<script setup>
import { useIpc } from "../../../utils/ipcMap"
import { useModel } from "../../../utils/modelValue"

const props = defineProps({
	modelValue: {},
	label: { type: String },
	schema: {},
	density: { type: String },
})

const emit = defineEmits(["update:modelValue"])

const modelObj = useModel(props, emit)

function doClear() {
	modelObj.value = undefined
}

const selectFile = useIpc("os", "selectFile")
async function doSelect() {
	const file = await selectFile(props.schema?.filters, modelObj.value)

	if (file) {
		modelObj.value = file
	}
}
</script>
