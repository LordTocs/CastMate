<template>
	<div class="flex flex-row">
		<label-floater :no-float="noFloat" :label="schema.name" input-id="resource" v-slot="labelProps">
			<c-autocomplete
				v-model="model"
				:required="!!schema.required"
				:label="schema.name"
				text-prop="config.name"
				:items="sortedResourceItems"
				:group-prop="resourceStore?.configGroupPath ? 'config.' + resourceStore.configGroupPath : undefined"
				:no-float="noFloat"
				v-bind="labelProps"
			>
				<template #groupHeader="{ item }" v-if="resourceStore?.selectorGroupHeaderComponent">
					<component :is="resourceStore.selectorGroupHeaderComponent" :item="item" />
				</template>
			</c-autocomplete>
		</label-floater>
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
import {
	LabelFloater,
	useResourceArray,
	useResourceCreateDialog,
	useResourceData,
	useResourceEditDialog,
} from "../../../main"
import PButton from "primevue/button"
import PMenu from "primevue/menu"
import { MenuItem } from "primevue/menuitem"
import _clamp from "lodash/clamp"
import _isMatch from "lodash/isMatch"
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

const filteredResourceItems = computed(() => {
	if (props.schema.filter == null) return resourceItems.value
	return resourceItems.value.filter((r) => _isMatch(r.config, props.schema.filter as object))
})

const sortedResourceItems = computed(() => {
	if (resourceStore.value?.selectSort == null) return filteredResourceItems.value

	const items = [...filteredResourceItems.value]
	return items.sort(resourceStore.value.selectSort)
})

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
