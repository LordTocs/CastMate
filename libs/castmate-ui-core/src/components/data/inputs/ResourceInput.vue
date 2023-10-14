<template>
	<div class="flex flex-row">
		<c-autocomplete
			v-model="model"
			:required="!!schema.required"
			:label="schema.name"
			text-prop="config.name"
			:items="resourceItems"
			input-id="resource"
			:no-float="noFloat"
		/>
		<p-button
			class="ml-1"
			text
			icon="mdi mdi-dots-vertical"
			v-if="hasDialogs"
			aria-controls="overlay_menu"
			@click="menu?.toggle($event)"
		></p-button>
		<p-menu ref="menu" id="overlay_menu" :model="menuItems" :popup="true" v-if="hasDialogs" />
	</div>
</template>

<script setup lang="ts">
import { SchemaResource, ResourceData } from "castmate-schema"
import { ResourceProxy } from "../../../util/data"
import { computed, nextTick, ref, useModel, watch } from "vue"
import { useResourceArray, useResourceCreateDialog, useResourceData, useResourceEditDialog } from "../../../main"
import PButton from "primevue/button"
import PMenu from "primevue/menu"
import { MenuItem } from "primevue/menuitem"
import _clamp from "lodash/clamp"
import { SharedDataInputProps } from "../DataInputTypes"

import CAutocomplete from "../base-components/CAutocomplete.vue"

const props = defineProps<
	{
		schema: SchemaResource
		modelValue: ResourceProxy | undefined
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")
const resourceStore = useResourceData(() => props.schema.resourceType)

const resourceItems = useResourceArray(() => props.schema.resourceType)

const hasDialogs = computed(() => resourceStore.value?.editDialog && resourceStore.value?.createDialog)

const createResourceDlg = useResourceCreateDialog(() => props.schema.resourceType)
const editResourceDlg = useResourceEditDialog(() => props.schema.resourceType)

const menu = ref<InstanceType<typeof PMenu>>()
const menuItems = computed<MenuItem[]>(() => {
	const selectedResource = props.modelValue ? resourceStore.value?.resources?.get(props.modelValue) : undefined

	return [
		{
			label: `Create New`,
			command(event) {
				createResourceDlg() //TODO: Select the item after it's been created
			},
		},
		{
			label: `Edit ${selectedResource?.config?.name ?? selectedResource?.id ?? props.schema.resourceType}`,
			disabled: !selectedResource,
			command(event) {
				if (!props.modelValue) return
				editResourceDlg(props.modelValue)
			},
		},
	]
})
</script>

<style scoped>
.container {
	display: inline-flex;
	cursor: pointer;
	position: relative;
	user-select: none;
}

.overlay {
	position: absolute;
	max-height: 25rem;
	overflow-y: auto;
}
</style>
