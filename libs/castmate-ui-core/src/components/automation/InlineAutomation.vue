<template>
	<div class="mb-2">
		<div v-if="!view.open" class="fake-input-box flex flex-row align-items-center" @click="doOpen">
			<span>
				<i :class="icon" v-if="icon" />
				{{ label }}
			</span>
		</div>
		<div
			v-else
			ref="editBody"
			@mousedown="stopPropagation"
			:style="{ height: `${view.height}px` }"
			class="edit-body"
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
	</div>
</template>

<script setup lang="ts">
import { InlineAutomation } from "castmate-schema"
import { InlineAutomationView } from "../../automations/automations.ts"
import { useModel, ref } from "vue"
import ExpanderSlider from "../util/ExpanderSlider.vue"
import AutomationEdit from "./AutomationEdit.vue"
import { ResourceProxyFactory, stopPropagation, DataInput } from "../../main"

import PButton from "primevue/button"

const props = defineProps<{
	label?: string
	icon?: string
	modelValue: InlineAutomation
	view: InlineAutomationView
}>()

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const editBody = ref<HTMLElement>()

function doOpen(ev: MouseEvent) {
	view.value.open = true
	ev.stopPropagation()
}

function doClose(ev: MouseEvent) {
	view.value.open = false
	ev.stopPropagation()
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
}

.edit-header {
	padding: 0.5rem 0.75rem;
	padding-bottom: 1rem;
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
