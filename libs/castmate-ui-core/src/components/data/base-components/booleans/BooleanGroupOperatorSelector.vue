<template>
	<c-dropdown v-model="model" :options="options" option-value="code" option-label="name" :local-path="localPath">
		<!-- <template #option="{ option, index }: { option: MenuItem, index: number }">
			<i :class="option.icon" />
		</template>

		<template #value="{ value }">
			<i :class="getIcon(value)" />
		</template> -->
	</c-dropdown>
</template>

<script setup lang="ts">
import { ValueCompareOperator } from "castmate-schema"
import { computed, useModel } from "vue"
import PDropdown from "primevue/dropdown"
import type { MenuItem } from "primevue/menuitem"
import { injectScrollAttachable } from "../../../../main"

import CDropdown from "../CDropdown.vue"

const props = defineProps<{
	modelValue: "and" | "or"
	localPath: string
}>()

const model = useModel(props, "modelValue")

function getIcon(value: ValueCompareOperator) {
	return options.value.find((o) => o.code === value)?.icon
}

const appendTo = injectScrollAttachable()

const options = computed<MenuItem[]>(() => {
	return [
		{
			// icon: "mdi mdi-less-than-or-equal",
			code: "and",
			name: "All",
		},
		{
			// icon: "mdi mdi-less-than",
			code: "or",
			name: "Any",
		},
	]
})
</script>
