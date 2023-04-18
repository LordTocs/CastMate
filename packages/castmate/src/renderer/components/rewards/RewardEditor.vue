<template>
	<v-form ref="form" v-model="modelValid">
		<v-text-field label="Title" v-model="title" />
		<v-text-field label="Description" v-model="prompt" />
		<color-input label="Background Color" v-model="backgroundColor" />
		<number-input
			label="Cost"
			v-model="cost"
			:schema="{
				required: true,
				min: 1,
			}"
			:rules="[(v) => v > 0 || `Rewards require a cost`]"
		/>
		<number-input
			label="Global Cooldown"
			v-model="globalCooldown"
			:rules="[(v) => !v || v > 0 || `Cooldowns must positive!`]"
		/>
		<v-switch label="Requires Message" v-model="userInputRequired" />
		<v-switch label="Skip Queue" v-model="autoFulfill" hide-details />
		<number-input
			label="Max Redemptions Per Stream"
			v-model="maxRedemptionsPerStream"
			:rules="[(v) => !v || v > 0 || `Max must positive!`]"
		/>
		<number-input
			label="Max Redemptions Per User Per Stream"
			v-model="maxRedemptionsPerUserPerStream"
			:rules="[(v) => !v || v > 0 || `Max must positive!`]"
		/>
	</v-form>
</template>

<script>
import { mapModel, mapModelValues } from "../../utils/modelValue"
import ColorInput from "../data/types/ColorInput.vue"
import NumberInput from "../data/types/NumberInput.vue"

export default {
	components: { NumberInput, ColorInput },
	props: {
		modelValue: {},
		valid: {},
	},
	emits: ["update:modelValue", "update:valid"],
	computed: {
		...mapModelValues([
			"title",
			"prompt",
			"backgroundColor",
			"cost",
			"userInputRequired",
			"autoFulfill",
			"globalCooldown",
			"maxRedemptionsPerStream",
			"maxRedemptionsPerUserPerStream",
		]),
		...mapModel("valid", "modelValid"),
	},
}
</script>

<style></style>
