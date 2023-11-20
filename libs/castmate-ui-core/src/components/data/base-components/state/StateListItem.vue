<template>
	<template v-if="props.modelValue && state && plugin">
		<span :style="{ color: plugin?.color }">{{ props.modelValue.plugin }}</span
		>.<span>{{ props.modelValue.state }}</span
		>&nbsp;
		<span class="text-200">({{ state?.value }})</span>
	</template>
	<template v-else-if="props.modelValue && plugin == null"> {{ props.modelValue?.state }} </template>
	<template v-else-if="props.modelValue"> {{ props.modelValue?.plugin }}.{{ props.modelValue?.state }} </template>
</template>

<script setup lang="ts">
import { usePlugin, useState } from "../../../../main"

const props = defineProps<{
	modelValue: { plugin?: string; state: string } | undefined | null
}>()

const plugin = usePlugin(() => props.modelValue?.plugin)
const state = useState(() => props.modelValue)
</script>

<style scoped></style>
