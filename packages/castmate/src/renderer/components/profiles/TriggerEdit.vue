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
			<document-path local-path="automation">
				<automation-edit
					class="h-full flex-grow-1"
					v-model="modelObj"
					v-model:view="view"
					:trigger="modelObj"
				/>
			</document-path>
			<expander-slider
				v-model="view.height"
				:color="(triggerColor as Color)"
				:container="cardBody"
			></expander-slider>
		</div>
		<div class="closed-body" v-else>
			<div style="width: 50%">
				<data-view v-if="trigger" :model-value="modelValue.config" :schema="trigger.config" />
			</div>
			<sequence-mini-preview style="width: 50%" :sequence="modelValue.sequence" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, useModel, onMounted, watch } from "vue"
import PButton from "primevue/button"
import { type TriggerData, Color } from "castmate-schema"
import {
	useTrigger,
	DataInput,
	DataView,
	TriggerSelector,
	TriggerView,
	useTriggerColors,
	ResourceProxyFactory,
	stopPropagation,
	provideDataContextSchema,
	AutomationEdit,
	ExpanderSlider,
	DocumentPath,
	SequenceMiniPreview,
} from "castmate-ui-core"
import isFunction from "lodash/isFunction"
import { useVModel, asyncComputed } from "@vueuse/core"
import { Schema } from "castmate-schema"
import _debounce from "lodash/debounce"

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
	flex-direction: row;

	/* background-color: var(--darkest-trigger-color); */
	background-color: var(--surface-a);
	padding-left: 2.5rem;
	padding-top: 0.25rem;
	padding-bottom: 0.25rem;
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
