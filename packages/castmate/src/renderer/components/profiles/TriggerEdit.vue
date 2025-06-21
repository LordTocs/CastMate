<template>
	<div class="trigger-card" :class="{ selected: isSelected }" :style="{ ...triggerColorStyle }">
		<div class="header">
			<div class="drag-handle">
				<i class="mdi mdi-drag" style="font-size: 2.5rem; line-height: 2.5rem" />
			</div>
			<div class="flex flex-column flex-grow-1 my-2 gap-1" v-if="!open" @dblclick="openTrigger">
				<div class="flex flex-row flex-grow-1 align-items-center">
					<span class="trigger-name">
						<i :class="[trigger?.icon]" />
						{{ trigger?.name }}
					</span>
					<template v-if="queueResource">
						&nbsp;&nbsp;-&nbsp;&nbsp;{{ queueResource?.config?.name }}
					</template>
					<template v-if="trigger?.headerComponent">
						&nbsp;&nbsp;-&nbsp;&nbsp;
						<component :is="trigger.headerComponent" :config="modelValue.config" />
					</template>
				</div>
				<div v-if="modelValue.description">
					{{ modelValue.description }}
				</div>
			</div>
			<div
				class="flex flex-row flex-wrap flex-grow-1 align-items-center my-2 mb-1 gap-1 pl-3"
				v-else
				@dblclick="closeTrigger"
			>
				<trigger-selector
					v-model="triggerModel"
					label="Trigger"
					style="flex-basis: 200px; flex: 1; min-width: 200px"
				/>
				<data-input
					v-model="modelObj.queue"
					:schema="{ type: ResourceProxyFactory, resourceType: 'ActionQueue', name: 'Queue' }"
					local-path="queue"
					style="flex-basis: 200px; flex: 1; min-width: 200px"
				/>
				<c-text-input
					multi-line
					v-model="modelObj.description"
					@mousedown="stopPropagation"
					style="flex: 1; min-width: 300px"
					placeholder="Description"
					local-path="description"
				/>
			</div>
			<p-button
				text
				class="no-focus-highlight"
				:icon="open ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'"
				@click.stop="toggleTriggerOpen"
				@mousedown="stopPropagation"
			/>
		</div>
		<div
			class="body"
			v-if="open"
			@mousedown="stopPropagation"
			:style="{ height: `${view.height}px` }"
			ref="cardBody"
		>
			<automation-edit class="h-full flex-grow-1" v-model="modelObj" v-model:view="view" :trigger="modelObj" />
			<expander-slider
				v-model="view.height"
				:color="(triggerColor as Color)"
				:container="cardBody"
			></expander-slider>
		</div>
		<div class="closed-body" v-else @dblclick="open = !open">
			<div style="width: 50%">
				<data-view v-if="trigger" :model-value="modelValue.config" :schema="trigger.config" />
			</div>
			<sequence-mini-preview style="width: 50%" :sequence="modelValue.sequence" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, useModel, onMounted, watch, provide } from "vue"
import PButton from "primevue/button"
import { type TriggerData, ActionQueueConfig, Color, ResourceData } from "castmate-schema"
import {
	useTrigger,
	DataInput,
	DataView,
	TriggerSelector,
	TriggerView,
	useTriggerColors,
	ResourceProxyFactory,
	provideDataContextSchema,
	AutomationEdit,
	ExpanderSlider,
	DataBindingPath,
	SequenceMiniPreview,
	TriggerSelection,
	usePropagationStop,
	useDocumentSelection,
	useDataBinding,
	useDataUIBinding,
	CTextInput,
	useResource,
} from "castmate-ui-core"
import isFunction from "lodash/isFunction"
import { useVModel, asyncComputed } from "@vueuse/core"
import { Schema } from "castmate-schema"
import _debounce from "lodash/debounce"
import { constructDefault } from "castmate-schema"
import { useRawDocumentSelection } from "../../../../../../libs/castmate-ui-core/src/util/document"

const stopPropagation = usePropagationStop()

const props = withDefaults(
	defineProps<{
		modelValue: TriggerData
		view: TriggerView
		selectedIds: string[]
		localPath: string
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

const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)

useDataBinding(() => props.localPath)

const view = useModel(props, "view")

const sequenceSelection = useDocumentSelection("automation.sequence")

const isSelected = computed(() => {
	return props.selectedIds.includes(modelObj.value.id)
})

const cardBody = ref<HTMLElement>()

const queueResource = useResource<ResourceData<ActionQueueConfig>>("ActionQueue", () => modelObj.value.queue)

const open = computed<boolean>({
	get() {
		return !!view.value.open
	},
	set(v) {
		view.value.open = v
	},
})

function openTrigger() {
	sequenceSelection.value = ["trigger"]
	open.value = true
}

function closeTrigger() {
	open.value = false
}

function toggleTriggerOpen() {
	if (open.value) {
		closeTrigger()
	} else {
		openTrigger()
	}
}

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

onMounted(() => {
	watch(trigger, async () => {
		if (trigger.value) {
			console.log("TRIGGER CHANGED!")
			const schemaDefaults = await constructDefault(trigger.value.config)
			modelObj.value.config = schemaDefaults

			const contextSchema =
				typeof trigger.value.context == "function"
					? await trigger.value.context(schemaDefaults)
					: trigger.value.context

			modelObj.value.testContext = await constructDefault(contextSchema)
		}
	})
})

const trigger = useTrigger(() => props.modelValue)

const context = ref<Schema>({ type: markRaw(Object), properties: {} })

async function fetchContext() {
	if (trigger.value == null) {
		context.value = { type: markRaw(Object), properties: {} }
		return
	}

	if (isFunction(trigger.value.context)) {
		const schema = await trigger.value.context(props.modelValue.config)
		context.value = schema
	} else {
		context.value = trigger.value.context
	}
}
const fetchContextDebounced = _debounce(fetchContext, 400)

onMounted(() => {
	watch(
		() => {
			return {
				config: props.modelValue.config,
				trigger: props.modelValue.trigger,
				plugin: props.modelValue.plugin,
			}
		},
		() => {
			fetchContextDebounced()
		},
		{ immediate: true, deep: true }
	)
})

provideDataContextSchema(context)

provide(
	"trigger-edit-select",
	computed<TriggerSelection>(() => ({
		trigger: props.modelValue?.trigger,
		plugin: props.modelValue?.plugin,
	}))
)

const { triggerColorStyle, triggerColor } = useTriggerColors(() => props.modelValue)

useDataUIBinding({
	onChildFocus(parsedPath) {
		open.value = true
	},
})
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
	flex-direction: row;

	/* background-color: var(--darkest-trigger-color); */
	background-color: var(--surface-a);
	padding-left: 2.5rem;
	padding-top: 0.25rem;
	padding-bottom: 0.25rem;
}

.closed-body :deep(.data-label) {
	color: var(--p-text-muted-color);
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
