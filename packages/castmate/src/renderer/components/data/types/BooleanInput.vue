<template>
	<div class="d-flex flex-row">
		<div
			v-if="schema.leftLabel"
			style="margin-top: 20px; margin-bottom: 8px; height: 24px"
			class="d-flex align-center mr-2"
		>
			<label class="v-label">{{ schema.leftLabel }} </label>
		</div>
		<v-switch
			v-model="modelObj"
			:density="density"
			color="primary"
			:indeterminate="modelObj == null"
		>
			<template v-slot:label>
				{{ schema.name || label }}
				<v-btn
					v-if="!schema.required"
					icon="mdi-close"
					variant="tonal"
					size="x-small"
					class="ml-1"
					:disabled="props.modelValue == null"
					@click.stop="clear"
					:density="density"
				/>
			</template>

			<template #loader>
				<v-icon
					v-if="thumbIcon"
					style="color: white"
					:icon="thumbIcon"
					size="x-small"
				/>
			</template>
		</v-switch>
	</div>
</template>

<script setup>
import { useModel } from "../../../utils/modelValue"

import { computed } from "vue";

const props = defineProps({
	modelValue: {},
	inset: {},
	schema: {},
	context: {},
	secret: { type: Boolean },
	colorRefs: {},
	label: { type: String },
	density: { type: String },
})
const emit = defineEmits(["update:modelValue"])

function clear() {
	emit("update:modelValue", undefined)
}

const modelObj = useModel(props, emit)

const thumbIcon = computed(() => {
	if (props.modelValue === true) return props.schema?.trueIcon
	if (!props.modelValue) return props.schema?.falseIcon
})
</script>
