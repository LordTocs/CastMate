<template>
	<div class="d-flex flex-row">
		<v-combobox
			v-model="modelObj"
			:loading="isLoading"
			:search-input.sync="search"
			:items="automations"
			:label="label"
			clearable
		>
		</v-combobox>
		<!--<v-btn
      fab
      small
      class="mx-1"
      v-if="showButtons"
      @click.stop="$refs.automationDlg.open()"
      :disabled="!modelValue"
    >
      <v-icon small> mdi-pencil </v-icon>
    </v-btn>
    v-btn
      fab
      small
      class="mx-1"
      v-if="showButtons"
      @click="$refs.addModal.open()"
      :disabled="!!value"
    >
      <v-icon small> mdi-plus </v-icon>
    </v-btn
    <automation-quick-edit-dialog ref="automationDlg" :automationName="modelValue" />-->
	</div>
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap"
import NamedItemModal from "../dialogs/NamedItemModal.vue"
import { mapModel } from "../../utils/modelValue"

import { defineAsyncComponent } from "vue"

export default {
	name: "automation-selector",
	props: {
		modelValue: {},
		label: { type: String, default: () => "Automation" },
		showButtons: { type: Boolean, default: () => true },
	},
	components: {
		NamedItemModal,
		AutomationQuickEditDialog: defineAsyncComponent(() =>
			import("./AutomationQuickEditDialog.vue")
		),
	},
	computed: {
		...mapModel(),
	},
	data() {
		return {
			isLoading: false,
			search: null,
			automations: [],
		}
	},
	methods: {
		...mapIpcs("core", ["getAutomations"]),
		async refreshAutomations() {
			this.automations = await this.getAutomations()
		},
		async filterAutomations(name) {
			const automations = await this.getAutomations()

			if (name) {
				automations.filter((a) =>
					a.toLowerCase().includes(name.toLowerCase())
				)
			}

			this.automations = automations
		},
		hasAutomation(automation) {
			return this.automations.includes(automation)
		},
	},
	async mounted() {
		this.refreshAutomations()
	},
	watch: {
		async search(newSearch) {
			await this.filterAutomations(newSearch)
		},
	},
}
</script>

<style></style>
