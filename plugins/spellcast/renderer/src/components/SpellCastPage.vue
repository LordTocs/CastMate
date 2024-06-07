<template>
	<div class="container">
		<div class="inner-container">
			<p-data-table
				class="flex flex-column"
				scrollable
				style="width: 100%; max-height: 100%"
				data-key="id"
				:value="spells"
			>
				<template #header>
					<div class="flex flex-row">
						<p-button @click="createDialog()"> Create Spell</p-button>
					</div>
				</template>
				<p-column class="column-fit-width">
					<template #body="{ data }: { data: SpellHookResource }">
						<spell-hook-preview :spell="data" />
					</template>
				</p-column>
				<p-column header="Bits" field="config.spellData.bits" class="column-fit-width"> </p-column>
				<p-column header="Title" field="config.name"> </p-column>
				<p-column class="column-fit-width">
					<template #body="{ data }: { data: SpellHookResource }">
						<div class="flex flex-row">
							<p-button icon="mdi mdi-pencil" text @click="editDialog(data.id)"></p-button>
							<p-button
								icon="mdi mdi-delete"
								severity="error"
								text
								@click="deleteDialog(data.id)"
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
import PButton from "primevue/button"
import { ResourceData } from "castmate-schema"
import SpellHookPreview from "./SpellHookPreview.vue"
import {
	useResourceArray,
	useResourceEditDialog,
	useResourceCreateDialog,
	useResourceDeleteDialog,
	useResourceStore,
} from "castmate-ui-core"
import { SpellConfig, SpellResourceConfig } from "castmate-plugin-spellcast-shared"

type SpellHookResource = ResourceData<SpellResourceConfig>
const spells = useResourceArray<SpellHookResource>("SpellHook")
const resourceStore = useResourceStore()

const editDialog = useResourceEditDialog("SpellHook", (id, data: SpellConfig) => {
	resourceStore.applyResourceConfig("SpellHook", id, {
		name: data.name,
		spellData: {
			enabled: data.enabled,
			description: data.description,
			bits: data.bits,
			color: data.color,
		},
	})
})
const createDialog = useResourceCreateDialog("SpellHook")
const deleteDialog = useResourceDeleteDialog("SpellHook")
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
</style>
