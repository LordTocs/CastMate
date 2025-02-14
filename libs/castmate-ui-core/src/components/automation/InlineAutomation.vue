<template>
	<p-input-group style="margin-top: 1.5rem">
		<label-floater :label="label" :icon="icon" input-id="inline-automation" v-slot="labelProps">
			<input-box
				v-if="!view?.open"
				:model="hasActions"
				v-bind="labelProps"
				style="cursor: pointer"
				@click="doOpen"
			>
				<sequence-mini-preview :sequence="props.modelValue?.sequence" />
			</input-box>
			<div
				v-else
				ref="editBody"
				@mousedown="stopPropagation"
				:style="{ height: `${view.height}px` }"
				class="edit-body"
				:class="{
					'p-filled': true,
					'p-inputwrapper-filled': true,
				}"
			>
				<div class="flex flex-row edit-header align-items-center">
					<span class="mr-2">
						<i :class="icon" v-if="icon" />
						{{ label }}
					</span>
					<data-input
						class="flex-grow-1 mr-2"
						no-float
						v-model="model.queue"
						:schema="{ type: ResourceProxyFactory, resourceType: 'ActionQueue', name: 'Queue' }"
						local-path="queue"
					/>
					<p-button
						text
						class="no-focus-highlight pl-1"
						@click.stop="doClose"
						@mousedown.stop
						icon="mdi mdi-chevron-up"
					/>
				</div>
				<automation-edit
					v-model="model"
					v-model:view="view"
					style="border-radius: --border-radius; flex-grow: 1; flex-shrink: 1"
				/>
				<expander-slider color="#3c3c3c" v-model="view.height" :container="editBody" />
			</div>
		</label-floater>
	</p-input-group>
</template>

<script setup lang="ts">
import { InlineAutomation } from "castmate-schema"
import { InlineAutomationView } from "../../automations/automations.ts"
import { useModel, ref, computed } from "vue"
import ExpanderSlider from "../util/ExpanderSlider.vue"
import AutomationEdit from "./AutomationEdit.vue"
import { ResourceProxyFactory, DataInput, usePropagationStop, useDataBinding } from "../../main"
import SequenceMiniPreview from "./mini/SequenceMiniPreview.vue"
import PButton from "primevue/button"
import PInputGroup from "primevue/inputgroup"
import { LabelFloater, InputBox } from "../../main"

const props = defineProps<{
	label?: string
	icon?: string
	modelValue: InlineAutomation
	view: InlineAutomationView
	localPath?: string
}>()

useDataBinding(() => props.localPath)

const hasActions = computed(() => {
	if (!props.modelValue?.sequence?.actions) return undefined
	if (props.modelValue.sequence.actions.length == 0) return undefined
	return true
})

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const editBody = ref<HTMLElement>()

const stopPropagation = usePropagationStop()

function doOpen(ev: MouseEvent) {
	view.value.open = true
	stopPropagation(ev)
}

function doClose(ev: MouseEvent) {
	view.value.open = false
	stopPropagation(ev)
}
</script>

<style scoped>
.edit-body {
	display: flex;
	flex-direction: column;
	--trigger-color: #3e3e3e;
	--darker-trigger-color: #2e2e2e;
	--darkest-trigger-color: #1e1e1e;
	--lighter-trigger-color: #4e4e4e;

	background-color: #171717;
	border: 2px solid #3c3c3c;
	border-radius: 6px;
	font-family: Lato, Helvetica, sans-serif;
	font-size: 1rem;
	width: 100%;
}

.edit-header {
	padding: 0.5rem 0.75rem;
}

.trigger-name {
	user-select: none;
	line-height: 1rem;
}

.fake-input-box {
	background-color: #171717;
	border: 2px solid #3c3c3c;
	border-radius: 6px;
	font-family: Lato, Helvetica, sans-serif;
	font-size: 1rem;
	padding: 0.5rem 0.75rem;
}
</style>
