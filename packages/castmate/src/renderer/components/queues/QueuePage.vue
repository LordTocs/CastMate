<template>
	<div class="container">
		<div class="inner-container" ref="containerDiv">
			<p-data-table
				class="flex flex-column"
				scrollable
				data-key="id"
				:value="queues"
				style="width: 100%; max-height: 100%"
				sort-field="config.name"
			>
				<template #header>
					<div class="flex flex-row">
						<p-button @click="createDialog()">Create Queue</p-button>
					</div>
				</template>

				<p-column class="column-fit-width">
					<template #body="{ data }: { data: ActionQueueResource }">
						<i :class="data.config.paused ? 'mdi mdi-pause' : 'mdi mdi-play'" />
					</template>
				</p-column>

				<p-column header="Name" field="config.name"> </p-column>

				<p-column header="Pending" class="column-fit-width">
					<template #body="{ data }: { data: ActionQueueResource }">
						{{ data.state.queue.length }}
					</template>
				</p-column>

				<p-column class="column-fit-width">
					<template #body="{ data }">
						<div class="flex flex-row gap-1">
							<p-button icon="mdi mdi-pencil" text @click="editDialog(data.id)" />
							<p-button icon="mdi mdi-delete" text @click="deleteDialog(data.id)" />
						</div>
					</template>
				</p-column>
			</p-data-table>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	useResourceStore,
	useResourceData,
	useResourceArray,
	useResourceEditDialog,
	useResourceCreateDialog,
	useResourceDeleteDialog,
} from "castmate-ui-core"
import { ActionQueueState, ActionQueueConfig, ResourceData } from "castmate-schema"
import { ref } from "vue"
import { useDialog } from "primevue/usedialog"
import PButton from "primevue/button"
import PDataTable from "primevue/datatable"
import PColumn from "primevue/column"

type ActionQueueResource = ResourceData<ActionQueueConfig, ActionQueueState>

const queues = useResourceArray<ActionQueueResource>("ActionQueue")
const editDialog = useResourceEditDialog("ActionQueue")
const createDialog = useResourceCreateDialog("ActionQueue")
const deleteDialog = useResourceDeleteDialog("ActionQueue")
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
