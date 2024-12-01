<template>
	<div class="container">
		<div class="inner-container">
			<p-data-table
				class="flex flex-column"
				:value="variables"
				data-key="id"
				:global-filter-fields="['id']"
				style="width: 100%; max-height: 100%"
				scrollable
				:sort-order="-1"
				sort-field="id"
			>
				<template #header>
					<div class="flex">
						<p-button @click="createNew">Create Variable</p-button>
						<div class="flex-grow-1" />
						<span class="p-input-icon-left">
							<i class="pi pi-search" />
							<!-- <p-input-text v-model="filters['global'].value" placeholder="Search" /> -->
						</span>
					</div>
				</template>

				<p-column header="Name" field="id"> </p-column>

				<p-column header="Type">
					<template #body="{ data }: { data: RendererVariableDefinition }">
						{{ getTypeByConstructor(data.schema.type)?.name ?? "UNKNOWN TYPE" }}
					</template>
				</p-column>

				<p-column header="Default Value">
					<template #body="{ data }: { data: RendererVariableDefinition }">
						<data-view :model-value="data.defaultValue" :schema="data.schema" />
					</template>
				</p-column>

				<p-column header="Current Value" class="current-value-column">
					<template #body="{ data }: { data: RendererVariableDefinition }">
						<variable-display-edit :id="data.id" />
					</template>
				</p-column>

				<p-column class="column-fit-width">
					<template #body="{ data }: { data: RendererVariableDefinition }">
						<div class="flex flex-row">
							<p-button icon="mdi mdi-refresh" text @click="reset(data)"></p-button>
							<p-button icon="mdi mdi-pencil" text @click="editDialog(data)"></p-button>
							<p-button
								icon="mdi mdi-delete"
								severity="error"
								text
								@click="deleteDialog(data)"
							></p-button>
						</div>
					</template>
				</p-column>
			</p-data-table>
		</div>
	</div>
</template>

<script setup lang="ts">
import PDataTable from "primevue/datatable"
import PColumn from "primevue/column"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
//import { FilterMatchMode } from "primevue/api"
import { usePluginStore, DataView } from "castmate-ui-core"
import { ref } from "vue"
import { useVariableList, RendererVariableDefinition, useVariableStore } from "../variable-store"
import { getTypeByConstructor } from "castmate-schema"
import { useDialog } from "primevue/usedialog"

import VariableEditDialog from "./VariableEditDialog.vue"
import VariableDisplayEdit from "./VariableDisplayEdit.vue"
import { useConfirm } from "primevue/useconfirm"

const variableStore = useVariableStore()
const variables = useVariableList()
const dialog = useDialog()
const confirm = useConfirm()

function createNew() {
	dialog.open(VariableEditDialog, {
		props: {
			header: "Create Variable",
			style: {
				width: "25vw",
			},
			modal: true,
		},
		async onClose(options) {
			console.log("Close!", options)
			if (!options) {
				return
			}

			await variableStore.addVariableDefinition(options.data)
		},
	})
}

// const filters = ref({
// 	global: { value: null, matchMode: FilterMatchMode.CONTAINS },
// })

function deleteDialog(def: RendererVariableDefinition) {
	confirm.require({
		header: `Delete ${def.id}?`,
		message: `Are you sure you want to delete ${def.id}`,
		icon: "mdi mdi-delete",
		accept() {
			variableStore.deleteVariable(def.id)
		},
	})
}

function editDialog(def: RendererVariableDefinition) {
	console.log(def)
	dialog.open(VariableEditDialog, {
		props: {
			header: `Edit ${def.id}`,
			style: {
				width: "25vw",
			},
			modal: true,
		},
		data: def,
		async onClose(options) {
			console.log("Close!", options)
			if (!options || options?.type == "dialog-close") {
				return
			}

			console.log("Setting Variable", def.id, options.data)

			await variableStore.setVariableDefinition(def.id, options.data)
		},
	})
}

async function reset(def: RendererVariableDefinition) {
	await variableStore.setVariableValue(def.id, def.defaultValue)
}
</script>

<style scoped>
.container {
	position: relative;
}

.inner-container {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	overflow: hidden;
}

:deep(.current-value-column) {
	width: 350px;
}
</style>
