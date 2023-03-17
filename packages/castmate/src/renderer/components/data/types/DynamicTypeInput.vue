<template>
	<data-input
		:label="props.label"
		v-model="modelObj"
		:schema="dynamicSchema"
		v-if="dynamicSchema != null"
	/>
</template>

<script setup>
import { ipcRenderer } from "electron"
import { ref, watch, onMounted } from "vue"
import { useModel } from "../../../utils/modelValue"
import DataInput from "../DataInput.vue"
import _cloneDeep from "lodash/cloneDeep"

const props = defineProps({
	modelValue: {},
	schema: {},
	label: { type: String },
	context: {},
})
const emit = defineEmits(["update:modelValue"])

const modelObj = useModel(props, emit)

const dynamicSchema = ref(null)

async function updateDynamicSchema() {
	if (!props.schema?.dynamicType) return null

	dynamicSchema.value = await ipcRenderer.invoke(
		props.schema?.dynamicType,
		_cloneDeep(props.context)
	)
}

watch(
	() => props.context,
	async () => {
		await updateDynamicSchema()
	}
)

onMounted(async () => {
	await updateDynamicSchema()
})
</script>
