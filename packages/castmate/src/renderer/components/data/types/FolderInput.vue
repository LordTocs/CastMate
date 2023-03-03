<template>
	<v-input :density="density" v-model="modelObj">
		<v-field
			:label="label"
			:active="!!modelObj"
			:dirty="!!modelObj"
			:clearable="!schema?.required"
			@click:clear="doClear"
		>
			<div class="v-field__input" v-bind="props" style="cursor: pointer" @click="doSelect">
				{{ modelObj }}
			</div>
		</v-field>
	</v-input>
</template>

<script setup>
import { useIpc } from "../../../utils/ipcMap";
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

const selectDir = useIpc('os', 'selectDir')
async function doSelect() {
    const dir = await selectDir(modelObj.value)

    if (dir) {
        modelObj.value = dir
    }
}
</script>
