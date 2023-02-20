<template>
	<v-dialog v-model="dialog" width="85%" class="d-flex flex-row" persistent>
		<v-card width="85vw">
			<v-toolbar dense flat>
				<v-toolbar-title class="font-weight-bold grey--text">
					{{ header }}
				</v-toolbar-title>
			</v-toolbar>
			<div class="d-flex flex-row py-2">
				<flex-scroller style="width: 400px" innerClass="px-2">
					<trigger-selector
						:model-value="localTriggerType"
						label="Trigger"
						@update:model-value="changeTriggerType"
						class="flex-grow-0"
						style="width: 350px"
					/>
					<v-sheet variant="outlined" rounded class="px-2 py-2 my-2">
						<template v-if="localTriggerType">
							<p class="my-2">
								{{ triggerDesc.name }}
							</p>
							<p class="text--secondary my-1">
								{{ triggerDesc.description }}
							</p>
							<v-divider />
						</template>

						<data-input
							v-if="triggerDesc && configSchema"
							:schema="configSchema"
							v-model="localMapping.config"
							:context="localMapping.config"
						/>
						<p v-else-if="triggerDesc" class="text-center my-4">
							No Configuration Needed
						</p>
						<p v-else class="text-center my-4">Select a Trigger</p>
					</v-sheet>
					<v-spacer />
					<trigger-context :triggerSpec="triggerDesc" />
				</flex-scroller>
				<automation-full-input
					class="flex-grow-1"
					v-if="localMapping"
					v-model="localMapping.automation"
					ref="automationInput"
				/>
			</div>

			<v-card-actions>
				<v-spacer />
				<v-btn
					color="primary"
					@click="apply"
					:disabled="!valid"
					variant="outlined"
				>
					Apply
				</v-btn>
				<v-btn @click="cancel" variant="outlined"> Cancel </v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import DataInput from "../data/DataInput.vue"
import TriggerSelector from "./TriggerSelector.vue"
import _cloneDeep from "lodash/cloneDeep"
import AutomationFullInput from "../automations/AutomationFullInput.vue"
import FlexScroller from "../layout/FlexScroller.vue"
import { constructDefaultSchema } from "../../utils/objects"
import TriggerContext from "./TriggerContext.vue"
import { trackAnalytic } from "../../utils/analytics.js"
import { mapState } from "pinia"
import { usePluginStore } from "../../store/plugins"

export default {
	components: {
		TriggerSelector,
		DataInput,
		AutomationFullInput,
		FlexScroller,
		TriggerContext,
	},
	props: {
		mapping: {},
		header: { type: String, default: () => "Add Trigger" },
		triggerType: {},
	},
	data() {
		return {
			dialog: false,
			localMapping: null,
			localTriggerType: null,
		}
	},
	computed: {
		...mapState(usePluginStore, {
			plugins: "plugins",
		}),
		triggerDesc() {
			if (!this.localTriggerType) return null
			return this.plugins[this.localTriggerType.pluginKey]?.triggers[
				this.localTriggerType.triggerKey
			]
		},
		configSchema() {
			return this.triggerDesc?.config
		},
		valid() {
			return this.localTriggerType
		},
	},
	methods: {
		open() {
			this.localMapping = _cloneDeep(this.mapping) || {
				config: null,
				automation: null,
			}
			this.localTriggerType = _cloneDeep(this.triggerType)
			trackAnalytic("openTrigger")
			this.dialog = true
		},
		async apply() {
			await this.$refs.automationInput.saveEditedAutomation()
			this.$emit("mapping", this.localTriggerType, this.localMapping)
			trackAnalytic("saveTrigger", { type: this.localTriggerType })
			this.dialog = false
		},
		cancel() {
			this.dialog = false
		},
		changeTriggerType(newType) {
			this.localTriggerType = newType
			this.localMapping.config = constructDefaultSchema(
				this.plugins[this.localTriggerType.pluginKey].triggers[
					this.localTriggerType.triggerKey
				].config
			)
		},
	},
}
</script>

<style></style>
