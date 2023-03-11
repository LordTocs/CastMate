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
	modelValue: {},
	schema: {},
	label: { type: String },
})

const falseIcon = computed(() => props.schema?.falseIcon ?? "mdi-close-thick")
const trueIcon = computed(() => props.schema?.trueIcon ?? "mdi-check-bold")
const toggleIcon = computed(() => props.schema?.toggleIcon ?? "mdi-swap-horizontal")

const icon = computed(() => {
	if (props.modelValue === "toggle") return toggleIcon.value
	if (props.modelValue === true) return trueIcon.value
	if (!props.modelValue) return falseIcon.value
})

</script>
