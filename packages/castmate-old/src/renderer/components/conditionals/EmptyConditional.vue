<template>
	<v-card-actions>
		<v-btn @click="setAnd"> Add And </v-btn>
		<v-btn @click="setOr"> Add Or </v-btn>
		<v-btn @click="setNot"> Add Not </v-btn>
		<v-btn @click="setValue"> Add Value </v-btn>
	</v-card-actions>
</template>

<script>
export default {
	props: {
		value: {},
	},
	methods: {
		setAnd() {
			this.$emit("input", { and: [] })
		},
		setOr() {
			this.$emit("input", { or: [] })
		},
		setNot() {
			this.$emit("input", { not: null })
		},
		setValue() {
			this.$emit("input", {})
		},
	},
}
</script>

<style></style>
