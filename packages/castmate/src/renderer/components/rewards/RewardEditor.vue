<template>
	<v-form ref="form" v-model="modelValid">
		<v-text-field label="Name" v-model="title" />
		<v-text-field label="Description" v-model="prompt" />
		<number-input
			label="Cost"
			v-model="cost"
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
import NumberInput from "../data/types/NumberInput.vue"

export default {
	components: { NumberInput },
	props: {
		modelValue: {},
		valid: {},
	},
	emits: ["update:modelValue", "update:valid"],
	computed: {
		...mapModelValues([
			"title",
			"prompt",
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
