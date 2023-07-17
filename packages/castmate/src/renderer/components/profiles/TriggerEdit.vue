<template>
	<div
		class="trigger-card"
		:style="{ '--trigger-color': trigger?.color, '--darker-trigger-color': darkerTriggerColor }"
	>
		<div class="header">
			<div class="drag-handle">
				<i class="mdi mdi-drag" style="font-size: 2.5rem; line-height: 2.5rem" />
			</div>
			<div class="flex flex-row flex-grow-1 align-items-center">
				<span class="trigger-name">
					{{ trigger?.name }}
				</span>
			</div>
			<p-button :icon="open ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'" @click="open = !open" />
		</div>
		<div class="body" v-if="open">
			<div class="config">
				<trigger-selector v-model="triggerModel" class="mb-4 mt-4" />
				<template v-if="trigger">
					<data-input :schema="trigger.config" v-model="modelObj.config" />
				</template>
			</div>
			<div class="automation">
				<automation-edit v-model="modelObj.sequenece" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import PButton from "primevue/button"
import { type TriggerData } from "castmate-schema"
import { useTrigger, DataInput, TriggerSelector } from "castmate-ui-core"
import { useVModel } from "@vueuse/core"
import AutomationEdit from "../automation/AutomationEdit.vue"
import * as chromatism from "chromatism2"

const open = ref(false)

const props = defineProps<{
	modelValue: TriggerData
}>()

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
