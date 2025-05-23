<template>
	<div class="flow-container" :style="{ ...actionColorStyle }" :class="{ 'is-selected': isSelected }">
		<div class="flow-cap" ref="cap" :class="{ 'is-testing': testTime != null }">
			<div class="flow-cap-top">
				<div class="flow-action-header action-handle">
					<i class="mdi flex-none" :class="action?.icon" />
					{{ action?.name }}
				</div>
			</div>

			<div class="flow-cap-bottom">
				<div class="flow-spacer-left"></div>
				<div class="flow-cap-bottom-right"></div>
			</div>
		</div>
		<template v-for="(flow, i) in model.subFlows" :key="flow.id">
			<div class="flow-row">
				<div class="flow-side" ref="sides" :class="{ 'is-testing': testTime != null }">
					<div class="flow-data">
						<component
							v-if="action?.flowComponent && model.subFlows[i]?.config != null"
							:is="action?.flowComponent"
							:plugin="model.plugin"
							:action="model.action"
							:flow-index="i"
							v-bind="action?.flowComponentExtraProps"
							v-model:action-config="model.config"
							v-model="model.subFlows[i].config"
							:sub-flows="subFlowConfigs"
						/>
					</div>
					<div class="flow-side-indicator">
						{{ i + 1 }}
					</div>
				</div>
				<automation-drop-zone
					:drop-key="`${modelValue.id}-${flow.id}`"
					:key="`${modelValue.id}-${flow.id}`"
					drop-axis="vertical"
					drop-location="middle"
					style="
						left: calc(var(--instant-width) / 2);
						width: var(--instant-width);
						min-height: var(--timeline-height);
					"
					@automation-drop="onAutomationDrop(i, $event)"
				/>
				<div class="flow-items">
					<sequence-actions-edit v-model="model.subFlows[i]" @self-destruct="removeFlow(i)" ref="subFlows" />
				</div>
			</div>
			<div
				class="flow-spacer"
				v-if="i != model.subFlows.length - 1"
				ref="spacers"
				:class="{ 'is-testing': testTime != null }"
			>
				<div class="flow-spacer-left"></div>
				<div class="flow-spacer-right"></div>
			</div>
		</template>
		<div class="flow-foot" ref="footer" :class="{ 'is-testing': testTime != null }">
			<div class="flow-foot-left"></div>
			<div class="flow-spacer-right"></div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { FlowAction } from "castmate-schema"
import {
	useAction,
	useActionColors,
	useActionTestTime,
	useIsSelected,
	SelectionPos,
	Selection,
	selectionOverlaps,
	useFlowAction,
} from "../../main"
import { ComputedRef, computed, inject, ref, useModel } from "vue"
import AutomationDropZone from "./AutomationDropZone.vue"
import SequenceActionsEdit from "./SequenceActionsEdit.vue"
import { Sequence } from "castmate-schema"
import { SelectionGetter } from "../../util/automation-dragdrop"

const props = defineProps<{
	modelValue: FlowAction
}>()

const isFloating = inject<ComputedRef<boolean>>(
	"sequence-floating",
	computed(() => false)
)

const { actionColorStyle } = useActionColors(() => props.modelValue, isFloating)

const model = useModel(props, "modelValue")
const action = useFlowAction(() => props.modelValue)

const isSelected = useIsSelected(() => props.modelValue.id)
const testTime = useActionTestTime(() => props.modelValue.id)

function removeFlow(i: number) {
	model.value.subFlows[i].actions = []
}

function onAutomationDrop(index: number, sequence: Sequence) {
	const newActions = [...sequence.actions, ...model.value.subFlows[index].actions]

	model.value.subFlows[index].actions = newActions
}

const subFlows = ref<SelectionGetter[]>([])

const cap = ref<HTMLElement | null>(null)
const footer = ref<HTMLElement | null>(null)

const sides = ref<HTMLElement[]>([])
const spacers = ref<HTMLElement[]>([])

const subFlowConfigs = computed(() => model.value.subFlows.map((s) => s.config))

function overlapsThis(container: HTMLElement, from: SelectionPos, to: SelectionPos) {
	if (selectionOverlaps(cap.value, container, from, to)) {
		return true
	}

	if (selectionOverlaps(footer.value, container, from, to)) {
		return true
	}

	for (const side of sides.value) {
		if (selectionOverlaps(side, container, from, to)) {
			return true
		}
	}

	for (const spacer of spacers.value) {
		if (selectionOverlaps(spacer, container, from, to)) {
			return true
		}
	}

	return false
}

defineExpose({
	getSelectedItems(container: HTMLElement, from: SelectionPos, to: SelectionPos): Selection {
		const result: Selection = []

		for (const subFlow of subFlows.value) {
			result.push(...subFlow.getSelectedItems(container, from, to))
		}

		if (overlapsThis(container, from, to)) {
			result.push(props.modelValue.id)
		}

		return result
	},
	deleteIds(ids: string[]) {
		for (const subFlow of subFlows.value) {
			subFlow.deleteIds(ids)
		}

		return !ids.includes(props.modelValue.id)
	},
})
</script>

<style scoped>
.flow-container {
	pointer-events: auto;
}

.flow-action-header {
	background-color: var(--darker-action-color);
	height: 1.5rem;
	cursor: grab;
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);
	transition: background-color 0.3s;
}

.flow-items {
	padding-bottom: 2rem;
}

.flow-cap-top {
	border-top: solid 2px var(--lighter-action-color);
	border-right: solid 2px var(--lighter-action-color);
	border-left: solid 2px var(--lighter-action-color);
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);
}

.flow-spacer {
	height: calc(var(--timeline-height) / 8);
	min-width: calc(var(--instant-width) * 1.5);
	display: flex;
}

.flow-spacer-left {
	width: var(--instant-width);
	flex-grow: 0;
	flex-shrink: 0;
	background-color: var(--action-color);
	height: 100%;
	border-left: solid 2px var(--lighter-action-color);
}

.flow-spacer-right {
	height: 100%;
	flex: 1;
	min-width: calc(var(--instant-width) * 0.5);
	background-color: var(--action-color);
	border-top: solid 2px var(--lighter-action-color);
	border-right: solid 2px var(--lighter-action-color);
	border-bottom: solid 2px var(--lighter-action-color);

	border-bottom-right-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);
}

.flow-row {
	position: relative;
	display: flex;
	min-height: var(--timeline-height);
	flex-direction: row;
}

.flow-side {
	width: var(--instant-width);
	background-color: var(--action-color);
	border-left: solid 2px var(--lighter-action-color);
	border-right: solid 2px var(--lighter-action-color);
	display: flex;
	flex-direction: row;
}

.flow-data {
	flex: 1;
	position: relative;
}

.flow-side-indicator {
	background-color: var(--darker-action-color);
	/* color: var(--action-color); */
	width: 1rem;
	height: var(--timeline-height);
	border-top-left-radius: var(--border-radius);
	border-bottom-left-radius: var(--border-radius);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}

.is-selected .flow-side {
	border-color: white;
}

.flow-cap {
	min-width: calc(var(--instant-width) * 1.5);
	height: var(--timeline-height);
	display: flex;
	flex-direction: column;
}

.flow-cap-bottom {
	display: flex;
	flex-direction: row;
	/* height: calc(var(--timeline-height) / 4); */
	flex: 1;

	position: relative;
}

.flow-cap-bottom-right {
	height: 100%;
	flex: 1;
	background-color: var(--action-color);
	border-bottom-right-radius: var(--border-radius);
	border-right: solid 2px var(--lighter-action-color);
	border-bottom: solid 2px var(--lighter-action-color);
}

.flow-foot {
	height: calc(var(--timeline-height) / 8);
	min-width: calc(var(--instant-width) * 1.5);
	display: flex;
}

.flow-foot-left {
	width: var(--instant-width);
	flex-grow: 0;
	flex-shrink: 0;
	background-color: var(--action-color);
	height: 100%;

	border-left: solid 2px var(--lighter-action-color);
	border-bottom: solid 2px var(--lighter-action-color);
	border-bottom-left-radius: var(--border-radius);
}

.is-selected > .flow-cap > .flow-cap-top {
	border-color: white;
}

.is-selected > .flow-cap > .flow-cap-bottom > .flow-spacer-left {
	border-color: white;
}

.is-selected > .flow-cap > .flow-cap-bottom > .flow-cap-bottom-right {
	border-color: white;
}

.is-selected > .flow-row > .flow-side {
	border-color: white;
}

.is-selected > .flow-spacer > .flow-spacer-left {
	border-color: white;
}
.is-selected > .flow-spacer > .flow-spacer-right {
	border-color: white;
}

.is-selected > .flow-foot > .flow-foot-left {
	border-color: white;
}
.is-selected > .flow-foot > .flow-spacer-right {
	border-color: white;
}
</style>
