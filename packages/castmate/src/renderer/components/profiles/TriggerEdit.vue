<template>
	<div
		class="trigger-card"
		:style="{ '--trigger-color': trigger?.color, '--darker-trigger-color': darkerTriggerColor }"
	>
		<div class="header">
			<div class="drag-handle">
				<i class="mdi mdi-drag" style="font-size: 2.5rem; line-height: 2.5rem" />
			</div>
			<div class="flex flex-row flex-grow-1 align-items-center" v-if="!open">
				<span class="trigger-name">
					<i :class="['mdi', trigger?.icon]" />
					{{ trigger?.name }}
				</span>
			</div>
			<div class="flex flex-row flex-grow-1 align-items-center" v-else>
				<trigger-selector v-model="triggerModel" />
			</div>
			<p-button text :icon="open ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'" @click="open = !open" />
		</div>
		<div class="body" v-if="open">
			<div class="config">
				<template v-if="trigger">
					<data-input :schema="trigger.config" v-model="modelObj.config" />
				</template>
			</div>
			<div class="automation">
				<automation-edit v-model="modelObj.sequence" v-model:view="view.sequenceView" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, useModel } from "vue"
import PButton from "primevue/button"
import { type TriggerData } from "castmate-schema"
import { useTrigger, DataInput, TriggerSelector, TriggerView } from "castmate-ui-core"
import { useVModel } from "@vueuse/core"
import AutomationEdit from "../automation/AutomationEdit.vue"
import * as chromatism from "chromatism2"

const props = withDefaults(
	defineProps<{
		modelValue: TriggerData
		view: TriggerView
	}>(),
	{
		view: () => ({
			id: "",
			open: false,
			sequenceView: {
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
	}
)

const view = useModel(props, "view")

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

const darkerTriggerColor = computed(() =>
	trigger.value?.color ? chromatism.shade(-20, trigger.value.color).hex : "#3f3f3f"
)

const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)

//const plugin = usePlugin(props.modelValue.plugin)
</script>

<style scoped>
.trigger-card {
	border: 2px solid var(--trigger-color);
	border-radius: var(--border-radius);
	background-color: var(--surface-a);

	display: flex;
	flex-direction: column;
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
	flex-direction: row;

	min-height: 600px;
}

.config {
	background-color: var(--surface-b);
	min-height: 300px;
	user-select: none;
}

.automation {
	flex: 1;
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
