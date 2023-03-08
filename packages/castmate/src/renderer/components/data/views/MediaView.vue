<template>
	<p v-if="modelValue">
		<span class="text--secondary" v-if="props.schema.name || props.label">
			{{ props.schema.name || label }}:
		</span>
		<v-icon :icon="mediaIcon" /> {{ props.modelValue }}
	</p>
</template>

<script setup>
import path from "path";
import { computed } from "vue"

import {
	ImageFormats,
	VideoFormats,
	SoundFormats,
} from "../../../utils/filetypes"

const props = defineProps({
	modelValue: { type: String },
	schema: {},
	label: { type: String },
})

const mediaIcon = computed(() => {
	if (!props.modelValue) return null
    const ext = path.extname(props.modelValue).toLowerCase()

	if (ImageFormats.includes(ext)) {
		return "mdi-image"
	}
	if (VideoFormats.includes(ext)) {
		return "mdi-video"
	}
    if (SoundFormats.includes(ext)) {
        return "mdi-volume-medium"
    }

    return "mdi-border-none-variant"
})
</script>
