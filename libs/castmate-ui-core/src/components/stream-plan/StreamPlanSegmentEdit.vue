<template>
	<div class="segment-card" :class="{ selected: isSelected }">
		<div class="segment-card-header">
			<div class="drag-handle">
				<i class="mdi mdi-drag" style="font-size: 2.5rem; line-height: 2.5rem" />
			</div>
			<div class="flex flex-row flex-grow-1 align-items-center" @mousedown="stopPropagation">
				<span class="segment-name">
					<p-input-text v-model="model.name" />
				</span>
			</div>
		</div>
		<div class="segment-card-body" @mousedown="stopPropagation">
			<inline-automation-edit
				label="On Activate"
				v-model="model.activationAutomation"
				v-model:view="view.activationAutomation"
			/>
			<inline-automation-edit
				label="On Deactivate"
				v-model="model.deactivationAutomation"
				v-model:view="view.deactivationAutomation"
			/>

			<data-binding-path local-path="components">
				<template v-for="componentId in Object.keys(model.components)" :key="componentId">
					<component
						v-if="streamPlanStore.components.has(componentId)"
						:is="streamPlanStore.components.get(componentId)"
						v-model="model.components[componentId]"
						:local-path="componentId"
					/>
				</template>
			</data-binding-path>
		</div>
	</div>
</template>

<script setup lang="ts">
import { StreamPlanSegment } from "castmate-schema"
import { StreamPlanSegmentView, useStreamPlanStore } from "./stream-plan-types"
import { computed, useModel } from "vue"
import { InlineAutomationEdit, useDataBinding, usePropagationStop, DataBindingPath } from "../../main"
import PInputText from "primevue/inputtext"

const props = defineProps<{
	modelValue: StreamPlanSegment
	view: StreamPlanSegmentView
	selectedIds: string[]
	localPath: string
}>()

useDataBinding(() => props.localPath)

const stopPropagation = usePropagationStop()

const streamPlanStore = useStreamPlanStore()

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const isSelected = computed(() => {
	return props.selectedIds.includes(model.value.id)
})
</script>

<style scoped>
.segment-card {
	border: 2px solid var(--surface-b);
	border-radius: var(--border-radius);
	background-color: var(--surface-a);

	display: flex;
	flex-direction: column;
}

.segment-card.selected {
	border: 2px solid white;
}

.segment-card-header {
	background-color: var(--surface-c);
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);

	display: flex;
	flex-direction: row;
}

.segment-card-body {
	display: flex;
	flex-direction: column;
	padding: 0.5rem 0.75rem;
}
</style>
