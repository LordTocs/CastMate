<template>
	<v-dialog persistent v-model="dialog" max-width="85vw">
		<v-card>
			<v-toolbar dense flat>
				<v-toolbar-title class="font-weight-bold grey--text">
					{{ header }}
				</v-toolbar-title>
			</v-toolbar>
			<automation-full-input v-model="modelObj" />
			<v-card-actions>
				<v-spacer />
				<v-btn color="primary" @click="ok" :disabled="!valid">
					Ok
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import { mapModel } from "../../utils/modelValue"
import AutomationFullInput from "./AutomationFullInput.vue"

export default {
	components: { AutomationFullInput },
	props: {
		header: { type: String, default: () => "" },
		modelValue: {},
	},
	emits: ["update:modelValue"],
	data() {
		return {
			dialog: false,
			automationPopover: false,
		}
	},
	computed: {
		...mapModel(),
		valid() {
			return true
		},
	},
	methods: {
		ok() {
			this.dialog = false
		},
		async open() {
			this.dialog = true
		},
	},
}
</script>

<style scoped>
.toolbox {
	width: 300px;
}
</style>
