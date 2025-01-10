<template>
	<template v-if="props.modelValue && state && plugin">
		<span style="white-space: nowrap">
			<span :style="{ color: plugin?.color }">{{ props.modelValue.plugin }}</span
			>.<span>{{ props.modelValue.state }}</span
			>&nbsp;
			<span class="text-200">(<data-view :model-value="state.value" :schema="removeName(state.schema)" />)</span>
		</span>
	</template>
	<template v-else-if="props.modelValue && plugin == null"> {{ props.modelValue?.state }} </template>
	<template v-else-if="props.modelValue"> {{ props.modelValue?.plugin }}.{{ props.modelValue?.state }} </template>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { usePlugin, useState } from "../../../../main"
import DataView from "../../DataView.vue"
import { Schema } from "castmate-schema"

const props = defineProps<{
	modelValue: { plugin?: string; state: string } | undefined | null
}>()

const plugin = usePlugin(() => props.modelValue?.plugin)
const state = useState(() => props.modelValue)
function removeName(schema: Schema): Schema {
	const result = { ...schema }
	delete result.name
	return result
}
</script>

<style scoped></style>
