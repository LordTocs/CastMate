<template>
	<div class="resource-slot flex flex-row align-items-center" :class="{ selected: isSelected }">
		<div class="slot-handle">
			<i class="mdi mdi-drag" style="font-size: 2.5rem; line-height: 2.5rem" />
		</div>
		<div class="px-3">
			{{ model.slotType }}
		</div>
		<div class="flex flex-row flex-grow-1 align-items-center" @mousedown="stopPropagation">
			<span class="segment-name">
				<p-input-text v-model="model.name" />
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { DashboardResourceSlot } from "castmate-plugin-dashboards-shared"
import { computed, useModel } from "vue"
import { DashboardResourceSlotView } from "../dashboard-types"
import { usePropagationStop } from "castmate-ui-core"
import PInputText from "primevue/inputtext"

const props = defineProps<{
	modelValue: DashboardResourceSlot
	view: DashboardResourceSlotView
	selectedIds: string[]
}>()

const stopPropagation = usePropagationStop()

const isSelected = computed(() => {
	return props.selectedIds.includes(model.value.id)
})

const model = useModel(props, "modelValue")
</script>

<style scoped>
.resource-slot {
	border: 2px solid var(--surface-b);
	border-radius: var(--border-radius);
	background-color: var(--surface-a);
}

.resource-slot.selected {
	border: 2px solid white;
}
</style>
