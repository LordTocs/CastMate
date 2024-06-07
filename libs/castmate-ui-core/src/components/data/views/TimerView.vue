<template>
	<span class="data-label" v-if="schema.name">{{ schema.name }}:</span>
	<span> {{ formatDuration(remaining) }}</span>
</template>

<script setup lang="ts">
import { SharedDataViewProps } from "../DataInputTypes"
import { formatDuration, SchemaTimer, Timer, isTimerStarted, getTimeRemaining } from "castmate-schema"
import { computed, onMounted, watch, ref } from "vue"

const props = defineProps<
	{
		modelValue: Timer
		schema: SchemaTimer
	} & SharedDataViewProps
>()

const isRunning = computed(() => {
	return props.modelValue && isTimerStarted(props.modelValue)
})

const updateForcer = ref(0)

const remaining = computed(() => {
	updateForcer.value
	return props.modelValue != null ? getTimeRemaining(props.modelValue) : 0
})

function updateTimer(timestamp: number) {
	updateForcer.value++

	if (isRunning.value) {
		requestAnimationFrame(updateTimer)
	}
}

onMounted(() => {
	watch(
		() => props.modelValue,
		() => {
			if (isRunning.value) {
				requestAnimationFrame(updateTimer)
			}
		},
		{ deep: true, immediate: true }
	)
})
</script>

<style scoped></style>
