<template>
	<p v-if="props.modelValue">
		<span class="text--secondary" v-if="props.schema.name || props.label">
			{{ props.schema.name || label }}:
		</span>
		{{ overlay?.config?.name ?? "MISSING OVERLAY" }} |
		{{ widget?.name ?? "MISSING WIDGET" }}
	</p>
</template>

<script setup>
import { computed } from "vue"
import { useResourceArray } from "../../../utils/resources"

const props = defineProps({
	modelValue: { },
	schema: {},
	label: { type: String },
})

const overlays = useResourceArray("overlay")

const overlay = computed(() =>
	overlays.value.find((o) => o.id == props.modelValue?.overlay)
)
const widget = computed(() =>
	overlay.value?.config?.widgets?.find((w) => w.id == props.modelValue?.widget)
)
</script>
