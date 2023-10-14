<template>
	<p-dropdown v-model="model" :options="options" option-value="code">
		<template #option="{ option, index }: { option: MenuItem, index: number }">
			<i :class="option.icon" />
		</template>

		<template #value="{ value }">
			<i :class="getIcon(value)" />
		</template>
	</p-dropdown>
</template>

<script setup lang="ts">
import { ValueCompareOperator } from "castmate-schema"
import { computed, useModel } from "vue"
import PDropdown from "primevue/dropdown"
import { MenuItem } from "primevue/menuitem"

const props = defineProps<{
	modelValue: ValueCompareOperator
}>()

const model = useModel(props, "modelValue")

function getIcon(value: ValueCompareOperator) {
	return options.value.find((o) => o.code === value)?.icon
}

const options = computed<MenuItem[]>(() => {
	return [
		{
			icon: "mdi mdi-less-than-or-equal",
			code: "lessThanEq",
		},
		{
			icon: "mdi mdi-less-than",
			code: "lessThan",
		},
		{
			icon: "mdi mdi-equal",
			code: "equal",
		},
		{
			icon: "mdi mdi-not-equal-variant",
			code: "notEqual",
		},
		{
			icon: "mdi mdi-greater-than",
			code: "greaterThan",
		},
		{
			icon: "mdi mdi-greater-than-or-equal",
			code: "greaterThanEq",
		},
	]
})
</script>
