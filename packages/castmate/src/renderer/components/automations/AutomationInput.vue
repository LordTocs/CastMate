<template>
	<v-input v-model="modelObj" @click.stop="$refs.editDlg.open()">
		<v-field
			:label="label"
			clearable
			:active="!!modelValue"
			style="cursor: pointer"
		>
			<div class="d-flex flex-row align-center preview">
				<v-chip outlined v-if="hasAutomationReference">
					<v-icon left> mdi-flash </v-icon>
					{{ modelValue }}
				</v-chip>
				<automation-preview
					:automation="modelValue"
					:max-actions="10"
				/>
			</div>
		</v-field>
	</v-input>
	<inline-automation-edit-dialog
		v-model="modelObj"
		ref="editDlg"
		:header="label"
	/>
</template>

<script>
import { mapModel } from "../../utils/modelValue"
import ActionMiniPreview from "../actions/ActionMiniPreview.vue"
import AutomationSelector from "./AutomationSelector.vue"
import InlineAutomationEditDialog from "./InlineAutomationEditDialog.vue"
import AutomationPreview from "./AutomationPreview.vue"
export default {
	components: {
		AutomationSelector,
		InlineAutomationEditDialog,
		ActionMiniPreview,
		AutomationPreview,
	},
	props: {
		modelValue: {},
		label: {},
	},
	emits: ["update:modelValue"],
	data() {
		return {
			automationPopover: false,
		}
	},
	methods: {},
	computed: {
		...mapModel(),
		hasInlineActions() {
			return this.modelValue instanceof Object
		},
		hasAutomationReference() {
			return (
				typeof this.modelValue == "string" ||
				this.modelValue instanceof String
			)
		},
		isEmpty() {
			return !this.hasInlineActions && !this.hasAutomationReference
		},
	},
}
</script>

<style scoped>
.preview {
	min-height: 43px;
	margin-top: 20px;
	margin-left: 6px;
}
</style>
