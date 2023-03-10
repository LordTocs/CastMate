<template>
	<v-text-field
		v-if="!isEnum || templateMode"
		v-model="modelObj"
		:label="schema.name || label"
		:clearable="!schema.required"
		:type="!secret ? 'text' : 'password'"
		:density="density"
	>
		<template #append-inner>
			<v-btn
				class="ml-1"
				v-if="canTemplate && isEnum"
				size="x-small"
				variant="tonal"
				@click="templateMode = false"
				icon="mdi-code-braces"
				color="success"
			/>
			<v-icon
				class="ml-1"
				v-if="canTemplate && !isEnum"
				size="x-small"
				icon="mdi-code-braces"
			>
			</v-icon>
		</template>
	</v-text-field>
	<enum-input
		v-else-if="isEnum && !secret"
		:enum="props.schema.enum"
		v-model="modelObj"
		:label="schema.name || label"
		:clearable="clearable"
		:context="context"
		:density="density"
	>
		<template #append-inner>
			<v-btn
				class="ml-1"
				v-if="canTemplate"
				size="x-small"
				variant="tonal"
				@click="templateMode = true"
				icon="mdi-code-braces"
			/>
		</template>
	</enum-input>
</template>

<script setup>
import { computed, ref, onMounted } from "vue"
import { useModel } from "../../../utils/modelValue"
import EnumInput from "./EnumInput.vue"

const props = defineProps({
	modelValue: {},
	schema: {},
	label: { type: String },
	context: {},
	secret: { type: Boolean, default: () => false },
	density: { type: String },
	colorRefs: {}
})
const emit = defineEmits(["update:modelValue"])
const modelObj = useModel(props, emit)

const clearable = computed(() => !props.schema?.required)
const secret = computed(() => props.secret || props.schema?.secret)
const isEnum = computed(() => !!props.schema.enum)

function isProbablyTemplate() {
	return !!props.modelValue?.contains?.("{{")
}
const templateMode = ref(false)
const canTemplate = computed(() => !!props.schema.template)
onMounted(() => {
	templateMode.value = isProbablyTemplate()
})
</script>

<style></style>
