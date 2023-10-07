<template>
	<div class="resource-item-list">
		<div class="resource-item" v-for="resource in resourceArray" :key="resource.id">
			<div class="resource-view">
				{{ resource.config.name ?? resource.id }}
			</div>
			<div class="resource-item-actions">
				<p-button icon="mdi mdi-pencil" @click="editResourceDlg(resource.id)" text></p-button>
				<p-button icon="mdi mdi-delete" @click="deleteResourceDlg(resource.id)" text></p-button>
			</div>
		</div>
		<div class="flex justify-content-end mt-1">
			<p-button @click="createResourceDlg()" text> Create {{ resourceType }}</p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useResourceArray, useResoureDeleteDialog } from "../../main"
import { useResourceData, useResourceCreateDialog, useResourceEditDialog } from "../../resources/resource-store"
import PButton from "primevue/button"

const props = defineProps<{
	resourceType: string
}>()

const resourceData = useResourceData(() => props.resourceType)
const resourceArray = useResourceArray(() => props.resourceType)

const createResourceDlg = useResourceCreateDialog(() => props.resourceType)
const editResourceDlg = useResourceEditDialog(() => props.resourceType)
const deleteResourceDlg = useResoureDeleteDialog(() => props.resourceType)
</script>

<style scoped>
.resource-item-list {
	display: flex;
	flex-direction: column;
	padding: 0.5rem;
	gap: 0.5rem;
}

.resource-item {
	display: flex;
	flex-direction: row;
	border-radius: var(--border-radius);
	padding-left: 0.5rem;
	padding-right: 0.5rem;
}

.resource-item:hover {
	background-color: var(--surface-100);
}

.resource-view {
	flex: 1;
	display: flex;
	flex-direction: row;
	align-items: center;
}

.resource-item-actions {
	display: flex;
	flex-direction: row;
}
</style>
