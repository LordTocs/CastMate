<template>
	<p>
		<span class="text--secondary" v-if="schema.name || label">
			{{ schema.name || label }}:
		</span>
		<v-icon :icon="icon" />
	</p>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
	modelValue: { type: String },
	schema: {},
	label: { type: String },
})

const falseIcon = computed(() => props.schema?.falseIcon ?? "mdi-close-thick")
const trueIcon = computed(() => props.schema?.trueIcon ?? "mdi-check-bold")

const icon = computed(() => props.modelValue ? trueIcon.value : falseIcon.value)

</script>
