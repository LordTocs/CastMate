<template>
	<div :class="{ 'object-group': isGroup }">
		<v-card-subtitle
			class="d-flex flex-row py-2 align-center"
			v-if="schema?.name"
		>
			<div class="flex-grow-1">{{ schema.name }}</div>
			<v-btn
				variant="tonal"
				flat
				:disabled="props.modelValue == null"
				icon="mdi-content-copy"
				size="x-small"
				class="ml-1"
				@click="copy"
			/>
			<v-btn
				variant="tonal"
				flat
				icon="mdi-content-paste"
				size="x-small"
				class="ml-1"
				@click="paste"
			/>
			<v-btn
				v-if="clearable"
				variant="tonal"
				flat
				:disabled="props.modelValue == null"
				icon="mdi-close"
				size="x-small"
				@click="clear"
				class="ml-1"
			/>
		</v-card-subtitle>
		<div :class="{ 'object-group-inner': isGroup }">
			<data-input
				v-for="propertyKey in propertyKeys"
				:key="propertyKey"
				:schema="schema.properties[propertyKey]"
				:model-value="modelValue ? modelValue[propertyKey] : null"
				@update:model-value="(v) => updateObject(propertyKey, v)"
				:context="context"
				:secret="secret"
				:density="density"
				:colorRefs="colorRefs"
			/>
		</div>
	</div>
</template>

<script setup>
import { defineAsyncComponent, computed } from "vue"
import { useElectronClipboard } from "../../../utils/clipboard"
import _cloneDeep from "lodash/cloneDeep"
import { pasteWithSchema } from "../../../utils/objects"

const props = defineProps({
	modelValue: {},
	schema: {},
	context: {},
	colorRefs: {},
	secret: { type: Boolean, default: () => false },
	density: { type: String },
})
const emit = defineEmits(["update:modelValue"])

const DataInput = computed(() =>
	defineAsyncComponent(() => import("../DataInput.vue"))
)

const isGroup = computed(() => props.schema?.name || props.schema?.group)

const propertyKeys = computed(() =>
	props.schema?.properties ? Object.keys(props.schema.properties) : []
)

const clearable = computed(() => !props.schema?.required)

function clear() {
	emit("update:modelValue", undefined)
}

function updateObject(key, value) {
	let newValue = props.modelValue ? { ...props.modelValue } : {}

	if (value !== "" && value !== undefined) {
		newValue[key] = value
	} else {
		delete newValue[key]
	}

	emit("update:modelValue", newValue)
}

const clipboard = useElectronClipboard()
function copy() {
	clipboard.setData(props.modelValue)
}

function paste() {
	const data = clipboard.getData()
	if (data == null)
		return
	const obj = _cloneDeep(props.modelValue) ?? {}
	pasteWithSchema(obj, data, props.schema)
	emit("update:modelValue", obj)
}

</script>

<style scoped>
.object-row {
	flex: 1;
}

.object-group {
	border-radius: 4px;
	border: thin solid currentColor;
	margin-bottom: 12px;
}

.object-group-inner {
	padding-left: 20px;
	padding-right: 12px;
}
</style>
