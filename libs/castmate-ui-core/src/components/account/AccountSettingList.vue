<template>
	<div class="account-item-list">
		<div v-for="account in accountArray" :key="account.id">
			<div class="account-view">
				<account-widget :account-type="props.resourceType" :account-id="account.id">
					<template #extra>
						<p-button icon="mdi mdi-delete" @click="deleteResourceDlg(account.id)" text></p-button>
					</template>
				</account-widget>
			</div>
		</div>
		<div class="flex justify-content-end mt-1">
			<p-button @click="createResourceDlg()" text> Add {{ resourceType }}</p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useResourceArray, useResourceCreateDialog } from "../../main"
import AccountWidget from "./AccountWidget.vue"
import { useResourceDeleteDialog } from "../../main"
import PButton from "primevue/button"

const props = defineProps<{
	resourceType: string
}>()

const accountArray = useResourceArray(() => props.resourceType)

const deleteResourceDlg = useResourceDeleteDialog(() => props.resourceType)
const createResourceDlg = useResourceCreateDialog(() => props.resourceType)
</script>

<style scoped></style>
