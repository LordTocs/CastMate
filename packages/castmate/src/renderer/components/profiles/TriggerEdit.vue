<template>
	<div class="trigger-card" :class="{ selected: isSelected }" :style="{ '--hello': 'blah', ...triggerColorStyle }">
		<div class="header">
			<div class="drag-handle">
				<i class="mdi mdi-drag" style="font-size: 2.5rem; line-height: 2.5rem" />
			</div>
			<div class="flex flex-row flex-grow-1 align-items-center" v-if="!open">
				<span class="trigger-name">
					<i :class="[trigger?.icon]" />
					{{ trigger?.name }}
				</span>
			</div>
			<div class="flex flex-row flex-grow-1 align-items-center" v-else>
				<trigger-selector v-model="triggerModel" />
			</div>
			<p-button
				text
				:icon="open ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'"
				@click.stop="open = !open"
				@mousedown.stop
			/>
		</div>
		<div class="body" v-if="open">
			<automation-edit
				v-model="modelObj"
				v-model:view="view.automationView"
				local-path="sequence"
				style="flex: 1"
			/>
			<div class="config">
				<template v-if="trigger">
					<data-input :schema="trigger.config" v-model="modelObj.config" local-path="config" />
				</template>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, useModel } from "vue"
import PButton from "primevue/button"
import { type TriggerData } from "castmate-schema"
import { useTrigger, DataInput, TriggerSelector, TriggerView, useTriggerColors } from "castmate-ui-core"
import { useVModel } from "@vueuse/core"
import AutomationEdit from "../automation/AutomationEdit.vue"

const props = withDefaults(
	defineProps<{
		modelValue: TriggerData
		view: TriggerView
		selectedIds: string[]
	}>(),
	{
		view: () => ({
			id: "",
			open: false,
			automationView: {
				panState: {
					panX: 0,
					panY: 0,
					zoomX: 1,
					zoomY: 1,
					panning: false,
				},
				selection: [],
			},
		}),
		selectedIds: () => [],
	}
)

const view = useModel(props, "view")

const isSelected = computed(() => {
	return props.selectedIds.includes(modelObj.value.id)
})

const open = computed<boolean>({
	get() {
		return !!view.value.open
	},
	set(v) {
		view.value.open = v
	},
})

const triggerModel = computed({
	get() {
		if (!props.modelValue.plugin || !props.modelValue.trigger) return undefined
		return { plugin: props.modelValue.plugin, trigger: props.modelValue.trigger }
	},
	set(value) {
		const newValue = { ...props.modelValue, ...value }
		if (!value) {
			delete newValue.trigger
			delete newValue.plugin
		}
		emit("update:modelValue", newValue)
	},
})

const trigger = useTrigger(() => props.modelValue)

const { triggerColorStyle } = useTriggerColors(() => props.modelValue)

const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)
</script>

<style scoped>
.trigger-card {
	border: 2px solid var(--trigger-color);
	border-radius: var(--border-radius);
	background-color: var(--surface-a);

	display: flex;
	flex-direction: column;
}

.trigger-card.selected {
	border: 2px solid white;
}

.header {
	background-color: var(--darker-trigger-color);
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);

	display: flex;
	flex-direction: row;
}

.body {
	display: flex;
	flex-direction: column;

	min-height: 600px;
}

.config {
	background-color: var(--surface-b);
	user-select: none;
	min-height: 200px;
}

.trigger-name {
	user-select: none;
	line-height: 1rem;
}

.drag-handle {
	cursor: grab;
	user-select: none;
}
</style>
