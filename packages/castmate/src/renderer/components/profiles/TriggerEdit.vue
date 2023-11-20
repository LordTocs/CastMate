<template>
	<div class="trigger-card" :class="{ selected: isSelected }" :style="{ ...triggerColorStyle }">
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
			<div class="flex flex-row flex-grow-1 align-items-center mt-1 mb-1" v-else>
				<trigger-selector v-model="triggerModel" class="flex-grow-1 mr-2" label="Trigger" />
				<data-input
					class="flex-grow-1 mr-2"
					no-float
					v-model="modelObj.queue"
					:schema="{ type: ResourceProxyFactory, resourceType: 'ActionQueue', name: 'Queue' }"
				/>
			</div>
			<p-button
				text
				class="no-focus-highlight"
				:icon="open ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'"
				@click.stop="open = !open"
				@mousedown.stop
			/>
		</div>
		<div
			class="body"
			v-if="open"
			@mousedown="stopPropagation"
			:style="{ height: `${view.height}px` }"
			ref="cardBody"
		>
			<div class="flex flex-row h-full">
				<automation-edit
					v-model="modelObj"
					v-model:view="view.automationView"
					local-path="sequence"
					style="flex: 1"
					:trigger="modelObj"
				/>
				<div class="config">
					<action-config-edit v-if="selectedAction" v-model="selectedAction" />
					<trigger-config-edit v-else-if="selectedTrigger" v-model="selectedTrigger" />
				</div>
			</div>
			<expander-slider
				v-model="view.height"
				:color="(triggerColor as Color)"
				:container="cardBody"
			></expander-slider>
		</div>
		<div class="closed-body" v-else>
			<data-view v-if="trigger" :model-value="modelValue.config" :schema="trigger.config" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, useModel } from "vue"
import PButton from "primevue/button"
import { type TriggerData, getActionById } from "castmate-schema"
import {
	useTrigger,
	DataInput,
	DataView,
	TriggerSelector,
	TriggerView,
	useTriggerColors,
	useDocumentSelection,
	useDocumentPath,
	joinDocumentPath,
	usePluginStore,
	ResourceProxyFactory,
	stopPropagation,
	provideDataContextSchema,
} from "castmate-ui-core"
import { useVModel } from "@vueuse/core"
import AutomationEdit from "../automation/AutomationEdit.vue"
import { AnyAction } from "castmate-schema"
import { ActionStack } from "castmate-schema"
import { ExpanderSlider } from "castmate-ui-core"
import { Color } from "castmate-schema"
import { isActionStack } from "castmate-schema"
import ActionConfigEdit from "./ActionConfigEdit.vue"
import TriggerConfigEdit from "./TriggerConfigEdit.vue"

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
			height: 900,
			automationView: {
				panState: {
					panX: 0,
					panY: 0,
					zoomX: 1,
					zoomY: 1,
					panning: false,
				},
			},
		}),
		selectedIds: () => [],
	}
)

const view = useModel(props, "view")

const isSelected = computed(() => {
	return props.selectedIds.includes(modelObj.value.id)
})

const cardBody = ref<HTMLElement>()

const documentPath = useDocumentPath()
const selection = useDocumentSelection(() => joinDocumentPath(documentPath.value, "sequence"))
const pluginStore = usePluginStore()

function findActionById(id: string) {
	let action: AnyAction | ActionStack | undefined = undefined

	action = getActionById(id, modelObj.value.sequence)
	if (action) {
		return action
	}

	for (const floatingSequence of modelObj.value.floatingSequences) {
		action = getActionById(id, floatingSequence)
		if (action) {
			return action
		}
	}
}

const selectedAction = computed<AnyAction | undefined>(() => {
	if (selection.value.length > 1 || selection.value.length == 0) {
		return undefined
	}
	const id = selection.value[0]

	let action: AnyAction | ActionStack | undefined = undefined

	action = findActionById(id)

	if (!action) return undefined
	if (isActionStack(action)) return undefined

	return action
})

const selectedTrigger = computed(() => {
	if (selection.value.length > 1 || selection.value.length == 0) {
		return undefined
	}
	const id = selection.value[0]

	if (id != "trigger") return undefined

	return props.modelValue
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

provideDataContextSchema(() => trigger.value?.context || markRaw({ type: Object, properties: {} }))

const { triggerColorStyle, triggerColor } = useTriggerColors(() => props.modelValue)

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

	/*min-height: 600px;*/
}

.closed-body {
	display: flex;
	flex-direction: column;

	background-color: var(--darkest-trigger-color);
	padding-left: 2.5rem;
	padding-top: 0.25rem;
	padding-bottom: 0.25rem;
}

.config {
	background-color: var(--surface-b);
	user-select: none;
	width: 350px;
	overflow-y: auto;
	overflow-x: visible;
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
