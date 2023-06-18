<template>
	<v-container fluid>
		<v-table :headers="variableHeaders">
			<thead>
				<tr>
					<th>Variable Name</th>
					<th>Type</th>
					<th>Default Value</th>
					<th>Current Value</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody v-if="variableList.length > 0">
				<tr v-for="variable in variableList" :key="variable.name">
					<td>{{ variable.name }}</td>
					<td>{{ variable.spec.type }}</td>
					<td>{{ variable.spec.default }}</td>
					<td class>
						<data-popover
							:model-value="variable.value"
							@update:model-value="
								(value) =>
									setVariableValue(variable.name, value)
							"
							:schema="variable.spec"
							:viewProps="{
								style: {
									display: 'table-cell',
									verticalAlign: 'middle',
								},
							}"
						/>
					</td>
					<td>
						<v-icon
							small
							class="mr-2"
							icon="mdi-refresh"
							@click="resetVariable(variable.name)"
						/>
						<v-icon
							small
							class="mr-2"
							icon="mdi-cog"
							@click.stop="
								editDlg.open(variable.name, variable.spec)
							"
						/>
						<v-icon
							small
							icon="mdi-delete"
							@click.stop="deleteVariable(variable.name)"
						/>
					</td>
				</tr>
			</tbody>
			<tbody v-else>
				<tr>
					<td colspan="5" class="px-4 py-8 text-center">
						<span>
							Create some variables to store intermediate values
							in.
						</span>
					</td>
				</tr>
			</tbody>
		</v-table>
		<v-btn
			@click="
				createDlg.open('', {
					type: 'Number',
					default: 0,
					serialized: true,
				})
			"
			color="primary"
			size="large"
			class="my-2"
		>
			Create Variable
		</v-btn>
		<confirm-dialog ref="deleteDlg" />
		<variable-spec-modal ref="editDlg" />
		<variable-spec-modal
			ref="createDlg"
			title="Create New Variable"
			:showCreate="true"
			:showSave="false"
		/>
		<div style="height: 5rem" />
	</v-container>
</template>

<script setup>
import VariableSpecModal from "../components/variables/VariableSpecModal.vue"
import ConfirmDialog from "../components/dialogs/ConfirmDialog.vue"
import DataPopover from "../components/data/DataPopover.vue"
import { computed, ref } from "vue"
import { useVariableStore } from "../store/variables"
import _cloneDeep from "lodash/cloneDeep"
import { useIpc } from "../utils/ipcMap"
import { usePluginStore } from "../store/plugins"

const pluginStore = usePluginStore()
const variableState = computed(() => pluginStore.rootState.variables)

const variableHeaders = [
	{ text: "Variable Name", value: "name" },
	{ text: "Type", value: "type", sortable: false },
	{ text: "Default Value", value: "default", sortable: false },
	{ text: "Current Value", value: "value", sortable: false },
	{ text: "Actions", value: "actions", sortable: false },
]

const variableStore = useVariableStore()

const variableList = computed(() => {
	return Object.keys(variableStore.variableSpecs).map((varName) => ({
		name: varName,
		spec: variableStore.variableSpecs[varName],
		value: variableState.value[varName],
	}))
})

const editDlg = ref(null)
const createDlg = ref(null)
const setVariableValue = useIpc("variables", "setVariableValue")
const resetVariable = useIpc("variables", "resetVariable")

const deleteDlg = ref(null)
const removeVariable = useIpc("variables", "removeVariable")
async function deleteVariable(name) {
	if (
		await deleteDlg.value.open(
			"Confirm",
			"Are you sure you want to delete this variable?"
		)
	) {
		await removeVariable(name)
	}
}
</script>

<style></style>
