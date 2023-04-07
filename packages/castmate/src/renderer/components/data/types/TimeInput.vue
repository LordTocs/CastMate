<template>
	<v-text-field
		v-model="modelObj"
		placeholder="hh:mm:ss"
		:label="label"
		v-maska="{
			mask: ['##:T#:T#', 'T#:T#', 'T#', '#'],
			tokens: { T: { pattern: /[0-6]/ } },
		}"
		:density="density"
	/>
</template>

<script>
import { mapModel } from "../../../utils/modelValue"

export default {
	props: {
		modelValue: {},
		label: { type: String, default: () => "Time" },
		density: { type: String },
	},
	emits: ["update:modelValue"],
	computed: {
		...mapModel(),
	},
}
</script>

<style></style>
