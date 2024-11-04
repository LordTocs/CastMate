<template>
	<div>
		<div class="slot-header">
			<p-button @click="slotMenuOpen"> <i class="mdi mdi-plus" /> Create Slot</p-button>
			<p-menu :model="addMenuItems" ref="addMenu" :popup="true" />
		</div>
		<document-data-collection
			:data-component="DashboardResourceSlotEdit"
			v-model="model"
			v-model:view="view"
			local-path="resourceSlots"
			handle-class="slot-handle"
		>
		</document-data-collection>
	</div>
</template>

<script setup lang="ts">
import { DashboardResourceSlot } from "castmate-plugin-dashboards-shared"
import { DocumentDataCollection, useSatelliteResourceStore } from "castmate-ui-core"
import { computed, ref, useModel } from "vue"
import PButton from "primevue/button"
import PMenu from "primevue/menu"
import type { MenuItem } from "primevue/menuitem"

import DashboardResourceSlotEdit from "./DashboardResourceSlotEdit.vue"
import { DashboardResourceSlotView } from "../dashboard-types"

import { nanoid } from "nanoid/non-secure"

const props = defineProps<{
	modelValue: DashboardResourceSlot[]
	view: DashboardResourceSlotView[]
}>()

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const satelliteResources = useSatelliteResourceStore()

const addMenu = ref<PMenu>()
const addMenuItems = computed<MenuItem[]>(() => {
	return satelliteResources.slotHandlerTypes.map((sh) => {
		return {
			label: sh,
			command() {
				addSlot(sh)
			},
		}
	})
})

async function createNewSlot(resourceType: string): Promise<[DashboardResourceSlot, DashboardResourceSlotView]> {
	const id = nanoid()

	return [
		{
			id,
			name: `${resourceType} Slot`,
			slotType: resourceType,
			config: {},
		},
		{
			id,
		},
	]
}

async function addSlot(resourceType: string) {
	const [data, viewdata] = await createNewSlot(resourceType)

	model.value.push(data)
	view.value.push(viewdata)
}

function slotMenuOpen(ev: MouseEvent) {
	addMenu.value?.toggle(ev)
}
</script>
