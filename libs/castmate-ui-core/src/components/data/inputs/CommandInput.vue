<template>
	<div class="command-input">
		<p-tab-view v-model:active-index="tabModel">
			<p-tab-panel header="Command">
				<template v-if="model?.mode == 'command'">
					<label-floater no-float label="Command" input-id="match" v-slot="labelProps">
						<p-input-text v-model="matchModel" v-bind="labelProps" style="width: 100%" />
					</label-floater>
					<template v-if="model?.arguments?.length">
						<p>Command Variables</p>
					</template>
					<draggable-collection
						v-if="model?.arguments"
						v-model="model.arguments"
						handle-class="command-drag-handle"
						data-type="command-value"
						key-prop="id"
						style="gap: 0.25rem"
					>
						<template #item="{ item, index }">
							<command-argument-edit v-model="model.arguments[index]" @delete="deleteValue(index)" />
						</template>
					</draggable-collection>
					<div v-if="model?.hasMessage" class="mt-1 command-message">Command Message</div>
					<div class="flex flex-row mt-2 gap-1 justify-content-center">
						<p-button @click="addParameter" size="small">Add Parameter</p-button>
						<p-button @click="toggleMessage" size="small">
							{{ model?.hasMessage ? "Remove Message" : "Add Message" }}</p-button
						>
					</div>
					<div class="command-preview pt-1">
						{{ previewString }}
					</div>
				</template>
			</p-tab-panel>
			<p-tab-panel header="Anywhere">
				<label-floater no-float label="Match Anywhere" input-id="match" v-slot="labelProps">
					<p-input-text v-model="matchModel" v-bind="labelProps" style="width: 100%" />
				</label-floater>
				<div class="p-inputgroup mt-2" v-if="model?.mode == 'string'">
					<p-check-box binary input-id="leftBoundary" v-model="model.leftBoundary" />
					<label for="leftBoundary" class="ml-2"> Left Break </label>
				</div>
				<div class="p-inputgroup mt-2" v-if="model?.mode == 'string'">
					<p-check-box binary input-id="rightBondary" v-model="model.rightBoundary" />
					<label for="rightBoundary" class="ml-2"> Right Break </label>
				</div>
				<div class="command-preview pt-1">
					{{ previewString }}
				</div>
			</p-tab-panel>
			<p-tab-panel header="RegEx">
				<label-floater no-float label="Regex" input-id="match" v-slot="labelProps">
					<p-input-text v-model="matchModel" v-bind="labelProps" style="width: 100%" />
				</label-floater>
				<div class="command-preview pt-1">
					{{ previewString }}
				</div>
			</p-tab-panel>
		</p-tab-view>
	</div>
</template>

<script setup lang="ts">
import PTabView from "primevue/tabview"
import PTabPanel from "primevue/tabpanel"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import { Command, CommandMode, SchemaCommand, getCommandInfoString } from "castmate-schema"
import { computed, useModel } from "vue"
import LabelFloater from "../base-components/LabelFloater.vue"
import { SharedDataInputProps } from "../DataInputTypes"
import CommandArgumentEdit from "../base-components/commands/CommandArgumentEdit.vue"
import { DraggableCollection } from "../../../main"
import { nanoid } from "nanoid/non-secure"
import PCheckBox from "primevue/checkbox"

const props = defineProps<
	{
		modelValue: Command | undefined
		schema: SchemaCommand
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const matchModel = computed({
	get() {
		return model.value?.match
	},
	set(v) {
		if (model.value) {
			model.value.match = v ?? ""
		} else {
			model.value = { mode: "command", match: v ?? "", arguments: [], hasMessage: false }
		}
	},
})

const tabModel = computed({
	get() {
		if (model.value?.mode == "string") {
			return 1
		} else if (model.value?.mode == "regex") {
			return 2
		}
		return 0
	},
	set(v) {
		console.log("Set Tab Model", v)
		const mode: CommandMode = v == 2 ? "regex" : v == 1 ? "string" : "command"
		if (model.value) {
			model.value.mode = mode
		} else {
			//@ts-ignore TODO FIX
			model.value = { mode, match: "", arguments: [], hasMessage: false }
		}
	},
})

function deleteValue(index: number) {
	if (model.value == null) return

	//@ts-ignore TODO FIX
	model.value.arguments.splice(index, 1)
}

function addParameter() {
	if (!model.value) {
		model.value = {
			mode: "command",
			match: "",
			arguments: [{ id: nanoid(), name: "", schema: { type: "String" } }],
			hasMessage: false,
		}
	} else {
		//@ts-ignore TODO FIX
		model.value.arguments.push({ id: nanoid(), name: "", schema: { type: "String" } })
	}
}

function toggleMessage() {
	if (!model.value) {
		model.value = {
			mode: "command",
			match: "",
			arguments: [],
			hasMessage: true,
		}
	} else {
		//@ts-ignore TODO FIX
		model.value.hasMessage = !model.value.hasMessage
	}
}

const previewString = computed(() => {
	return getCommandInfoString(props.modelValue)
})
</script>

<style scoped>
.command-message {
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
	padding: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--surface-b);
}

.command-preview {
	text-align: center;
}

.command-input :deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
	padding: 0.25rem 0.5rem;
}

.command-input :deep(.p-tabview .p-tabview-panels) {
	padding: 0.75rem;
}
</style>
