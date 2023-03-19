<template>
	<v-text-field
		v-if="templateMode"
		:label="label"
		v-model="templateModel"
		:clearable="clearable"
		:placeholder="placeholder"
		:density="density"
		v-bind="$attrs"
	>
		<template #append-inner>
			<p class="text-disabled" v-if="unit">
				{{ unit?.name }}
			</p>
			<v-btn
				class="ml-1"
				:active="true"
				size="x-small"
				variant="tonal"
				:disabled="!isValueNumber"
				@click="templateMode = false"
				icon="mdi-code-braces"
			/>
		</template>
	</v-text-field>
	<template v-else>
		<v-text-field
			v-if="!isEnum && !isSlider"
			:label="label"
			v-model="lazyNumberData"
			type="number"
			:clearable="clearable"
			:density="density"
			:placeholder="placeholder"
			v-bind="$attrs"
			:min="min"
			:max="max"
			@change="onChange"
		>
			<template #append-inner>
				<p class="text-disabled" v-if="unit">
					{{ unit?.name }}
				</p>
				<v-btn
					class="ml-1"
					v-if="canTemplate"
					size="x-small"
					variant="tonal"
					@click="templateMode = true"
					icon="mdi-code-braces"
				/>
			</template>
		</v-text-field>
		<enum-input
			v-else-if="isEnum"
			v-model="numberModel"
			:enum="props.schema.enum"
			:label="label"
			:clearable="clearable"
			:density="density"
			v-bind="$attrs"
		>
			<template #append-inner>
				<p class="text-disabled" v-if="unit">
					{{ unit?.name }}
				</p>
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
		<template v-else-if="isSlider">
			<div class="text-caption" v-if="props.label">
				{{ props.label }}
			</div>
			<v-slider
				v-model="numberModel"
				thumb-label
				:min="min"
				:max="max"
				:step="step"
				:density="density"
			>
				<template #append>
					<v-btn
						class="ml-1"
						v-if="clearable"
						size="x-small"
						variant="tonal"
						:disabled="props.modelValue == null"
						@click="clear"
						icon="mdi-close"
					/>
					<v-btn
						class="ml-1"
						v-if="canTemplate"
						size="x-small"
						variant="tonal"
						@click="templateMode = true"
						icon="mdi-code-braces"
					/>
				</template>
			</v-slider>
		</template>
	</template>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue"
import { useModel } from "../../../utils/modelValue"
import EnumInput from "./EnumInput.vue"
const props = defineProps({
	modelValue: {},
	schema: {},
	label: {},
	density: { type: String },
	context: {},
	secret: { type: Boolean },
	colorRefs: {},
})
const emit = defineEmits(["update:modelValue"])

const lazyNumberData = ref(null)

const numberModel = computed({
	get() {
		return props.modelValue
	},
	set(value) {
		if (value == null || String(value).trim() == "") {
			return clear()
		}
		console.log("Updating Number Model")
		emit("update:modelValue", value)
	},
})
const templateModel = useModel(props, emit)

const placeholder = computed(() => props.schema?.placeholder)
const unit = computed(() => props.schema?.unit)
const isEnum = computed(() => !!props.schema?.enum)
const isSlider = computed(() => props.schema?.slider ?? false)
const min = computed(
	() => props.schema?.min ?? (isSlider.value ? 0 : undefined)
)
const max = computed(
	() => props.schema?.max ?? (isSlider.value ? 100 : undefined)
)
const step = computed(
	() => props.schema?.step ?? (isSlider.value ? 1 : undefined)
)

const clearable = computed(() => !props.schema?.required)

function clear() {
	emit("update:modelValue", undefined)
}

const templateMode = ref(false)
const canTemplate = computed(() => !!props.schema?.template)

const isValueNumber = computed(() => {
	if (props.modelValue == null) return true

	return !isNaN(Number(props.modelValue))
})

onMounted(() => {
	templateMode.value = !isValueNumber.value
	lazyNumberData.value =
		props.modelValue != null ? String(props.modelValue) : ""
})

watch(
	() => props.modelValue,
	(newValue) => {
		lazyNumberData.value = newValue != null ? String(newValue) : ""
	}
)

function onChange() {
	const newValue = Number(lazyNumberData.value)
	emit("update:modelValue", isNaN(newValue) ? 0 : newValue)
}
</script>

<style></style>
