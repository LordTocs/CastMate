<template>
	<v-container fluid>
		<link-table
			:items="planItems"
			name="Stream Plans"
			@nav="onNav"
			@create="createDlg.open()"
		>
			<template #item-input="{ item }">
				<v-btn
					size="small"
					class="mx-1"
					icon="mdi-delete"
					@click.stop="tryDelete(item)"
				/>
				<v-btn
					size="small"
					class="mx-1"
					icon="mdi-content-copy"
					@click.stop="tryDuplicate(item)"
				/>
				<v-btn
					size="small"
					class="mx-1"
					icon="mdi-pencil"
					@click.stop="tryRename(item)"
				/>
			</template>
		</link-table>
	</v-container>
	<named-item-confirmation ref="duplicateDlg" />
	<confirm-dialog ref="deleteDlg" />
	<named-item-modal
		ref="createDlg"
		header="Create New Stream Plan"
		label="Name"
		@created="create($event)"
	/>
</template>

<script setup>
import LinkTable from "../components/table/LinkTable.vue"
import ConfirmDialog from "../components/dialogs/ConfirmDialog.vue"
import NamedItemConfirmation from "../components/dialogs/NamedItemConfirmation.vue"
import NamedItemModal from "../components/dialogs/NamedItemModal.vue"
import { useResourceArray, useResourceFunctions } from "../utils/resources"
import { computed, ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const streamplans = useResourceArray("streamplan")
const streamPlanResource = useResourceFunctions("streamplan")

const planItems = computed(() =>
	streamplans.value.map((p) => ({ id: p.id, name: p.config.name }))
)

const createDlg = ref(null)
const duplicateDlg = ref(null)
const deleteDlg = ref(null)

function onNav(item) {
	router.push(`/streamplans/${item.id}`)
}

async function create(name) {
	const newPlan = await streamPlanResource.create({ name })
	router.push(`/streamplans/${newPlan.id}`)
}

async function tryDelete(item) {
	if (
		await deleteDlg.value.open(
			"Confirm",
			`Are you sure you want to delete ${item.name}?`
		)
	) {
		await streamPlanResource.delete(item.id)
	}
}

async function tryDuplicate(item) {
	if (
		await duplicateDlg.value.open(
			`Duplicate ${item.name}?`,
			`New Stream Plan's Name`,
			"Duplicate",
			"Cancel"
		)
	) {
		const newName = duplicateDlg.value.name
		const newPlan = await streamPlanResource.clone(item.id)
		await streamPlanResource.setConfig(newPlan.id, {
			...newPlan.config,
			name: newName,
		})
		router.push(`/streamplans/${newPlan.id}`)
	}
}
</script>
