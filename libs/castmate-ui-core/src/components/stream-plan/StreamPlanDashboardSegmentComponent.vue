<template>
	<component v-if="componentComponent" :is="componentComponent" :config="config" />
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useStreamPlanStore } from "./stream-plan-types"

const streamPlanStore = useStreamPlanStore()

const componentComponent = computed(() => {
	return streamPlanStore.viewComponents.get(props.type)
})

const props = defineProps<{
	type: string
	config: any
}>()
</script>
