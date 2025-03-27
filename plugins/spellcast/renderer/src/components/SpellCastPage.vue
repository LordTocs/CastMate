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
						<div class="flex-grow-1" />
						<p-button size="small" @click="openExtensionPopout"> View Extension </p-button>
					</div>
				</template>
				<p-column class="column-fit-width" header="Enabled">
					<template #body="{ data }: { data: SpellHookResource }">
						<spell-enable-switch :spell-id="data.id" />
					</template>
				</p-column>
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

import SpellEnableSwitch from "./SpellEnableSwitch.vue"

import { ResourceData } from "castmate-schema"
import SpellHookPreview from "./SpellHookPreview.vue"
import {
	useResourceArray,
	useResourceEditDialog,
	useResourceCreateDialog,
	useResourceDeleteDialog,
	useResourceStore,
	useResource,
} from "castmate-ui-core"
import { SpellConfig, SpellResourceConfig } from "castmate-plugin-spellcast-shared"

import { useChannelAccountResource } from "castmate-plugin-twitch-renderer"

type SpellHookResource = ResourceData<SpellResourceConfig>
const spells = useResourceArray<SpellHookResource>("SpellHook")
const resourceStore = useResourceStore()

async function changeEnabled(id: string, enabled: boolean) {
	resourceStore.applyResourceConfig("SpellHook", id, { spellData: { enabled } })
}

const editDialog = useResourceEditDialog("SpellHook")
const createDialog = useResourceCreateDialog("SpellHook")
const deleteDialog = useResourceDeleteDialog("SpellHook")

const channel = useChannelAccountResource()

function openExtensionPopout() {
	if (!channel.value) return
	const popoutUrl = `https://www.twitch.tv/popout/${channel.value.config.name}/extensions/d6rcoml9cel8i3y7amoqjsqtstwtun/component`
	window.open(popoutUrl, "_blank")
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
</style>
