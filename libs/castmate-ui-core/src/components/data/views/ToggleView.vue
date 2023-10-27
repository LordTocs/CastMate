<template>
	<span class="data-label">{{ schema.name }}:</span>
	<i :class="icon" />
</template>

<script setup lang="ts">
import { SharedDataViewProps } from "../DataInputTypes"
import { computed } from "vue"
import { SchemaToggle } from "castmate-schema"

const props = defineProps<
	{
		modelValue: boolean | undefined
		schema: SchemaToggle
	} & SharedDataViewProps
>()

const icon = computed(() => {
	if (props.modelValue === true) {
		return props.schema.trueIcon ?? "pi pi-check"
	}
	if (props.modelValue === false) {
		return props.schema.falseIcon ?? "pi pi-times"
	}
	if (props.modelValue === "toggle") {
		return props.schema.toggleIcon ?? "mdi mdi-swap-horizontal"
	}
	return props.schema.falseIcon ?? "pi pi-times"
})
</script>
