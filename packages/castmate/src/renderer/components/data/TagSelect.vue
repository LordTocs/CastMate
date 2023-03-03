<template>
	<v-combobox
		multiple
		chips
		closable-chips
		:label="label"
		v-model="modelObj"
		:density="density"
		:clearable="clearable"
	>
	</v-combobox>
</template>

<script>
import { mapModel } from "../../utils/modelValue"
export default {
	props: {
		modelValue: {},
		label: { type: String, default: () => "Tags" },
		density: { type: String },
		clearable: { type: Boolean, default: false },
	},
	emits: ["update:modelValue"],
	computed: {
		...mapModel(),
	},
}
</script>

<style></style>
