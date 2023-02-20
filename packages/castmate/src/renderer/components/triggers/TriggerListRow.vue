<template>
	<tr class="no-hover">
		<td :style="{ backgroundColor: plugins[pluginKey].color }" width="1px">
			{{ plugins[pluginKey].triggers[triggerKey].name || triggerKey }}
		</td>
		<td width="10%">
			<data-view
				:schema="plugins[pluginKey].triggers[triggerKey].config"
				:value="mapping.config"
			/>
		</td>
		<td width="10%">
			<v-chip
				class="ma-2"
				outlined
				v-if="
					typeof mapping.automation == 'string' ||
					mapping.automation instanceof String
				"
			>
				<v-icon left> mdi-flash </v-icon>
				{{ mapping.automation }}
			</v-chip>
		</td>
		<td>
			<automation-preview
				ref="preview"
				:automation="mapping.automation"
				:maxActions="10"
			/>
		</td>
		<td class="text-right" width="1px">
			<trigger-edit-modal
				header="Edit Trigger"
				ref="editModal"
				:mapping="mapping"
				:triggerType="{ triggerKey, pluginKey }"
				@mapping="updateMapping"
			/>
			<v-btn
				dark
				size="small"
				class="mx-1"
				icon
				@click="$refs.editModal.open()"
				elevation="0"
			>
				<v-icon>mdi-pencil</v-icon>
			</v-btn>
			<v-menu bottom right>
				<template v-slot:activator="{ props }">
					<v-btn
						size="small"
						class="mx-1"
						dark
						icon
						v-bind="props"
						elevation="0"
					>
						<v-icon>mdi-dots-vertical</v-icon>
					</v-btn>
				</template>

				<v-list>
					<v-list-item link>
						<v-list-item-title @click="$refs.editModal.open()">
							Edit
						</v-list-item-title>
					</v-list-item>
					<v-list-item link @click="tryDelete()">
						<v-list-item-title> Delete </v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
		</td>
		<confirm-dialog ref="deleteDlg" />
	</tr>
</template>

<script>
import { mapState } from "pinia"
import { usePluginStore } from "../../store/plugins"
import AutomationPreview from "../automations/AutomationPreview.vue"
import DataView from "../data/DataView.vue"
import ConfirmDialog from "../dialogs/ConfirmDialog.vue"
import TriggerEditModal from "./TriggerEditModal.vue"

export default {
	components: {
		DataView,
		AutomationPreview,
		TriggerEditModal,
		ConfirmDialog,
	},
	props: {
		triggerKey: { type: String },
		pluginKey: { type: String, required: true },
		mapping: {},
	},
	computed: {
		...mapState(usePluginStore, {
			plugins: "plugins",
		}),
	},
	methods: {
		async tryDelete() {
			if (
				await this.$refs.deleteDlg.open(
					"Confirm",
					"Are you sure you want to delete this trigger?"
				)
			) {
				//Delete the command
				this.$emit("delete")
			}
		},
		updateMapping(tt, mapping) {
			this.$refs.preview.reloadAutomation()
			this.$emit("mapping", tt, mapping)
		},
	},
}
</script>

<style></style>
