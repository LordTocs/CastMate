<template>
	<span class="data-label" v-if="schema.name">{{ schema.name }}: </span>
	<span v-if="modelString">{{ modelString }}</span>
</template>

<script setup lang="ts">
import { KeyCombo, SchemaKeyCombo } from "castmate-plugin-input-shared"
import { SharedDataViewProps } from "castmate-ui-core"
import { computed } from "vue"

const props = defineProps<
	{
		modelValue: KeyCombo | undefined
		schema: SchemaKeyCombo
	} & SharedDataViewProps
>()

const modelString = computed(() => {
	if (!props.modelValue) return undefined
	if (props.modelValue.length == 0) return undefined

	let result = ""

	for (let i = 0; i < props.modelValue.length; ++i) {
		const key = props.modelValue[i]
		let name: string = key
		if (name.startsWith("Left")) {
			name = name.substring(4)
		}

		result += name

		if (i != props.modelValue.length - 1) {
			result += " + "
		}
	}

	return result
})
</script>
