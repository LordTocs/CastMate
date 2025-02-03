<template>
	<div class="command-input">
		<p-tabs v-model:value="tabModel">
			<p-tab-list>
				<p-tab value="command" class="small-tab">Command</p-tab>
				<p-tab value="string" class="small-tab">Anywhere</p-tab>
				<p-tab value="regex" class="small-tab">RegEx</p-tab>
			</p-tab-list>
			<p-tab-panels>
				<p-tab-panel value="command">
					<template v-if="model?.mode == 'command'">
						<command-match-input label="Command" v-model="matchModel" />
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
							local-path="arguments"
						>
							<template #item="{ item, index }">
								<command-argument-edit
									v-model="model.arguments[index]"
									@delete="deleteValue(index)"
									:local-path="`[${index}]`"
								/>
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
				<p-tab-panel value="string">
					<command-match-input label="Match Anywhere" v-model="matchModel" />
					<p-input-group class="mt-2" v-if="model?.mode == 'string'">
						<c-check-box local-path="leftBoundary" v-model="leftBoundaryModel" />
						<label for="leftBoundary" class="ml-2"> Left Break </label>
					</p-input-group>
					<p-input-group class="mt-2" v-if="model?.mode == 'string'">
						<c-check-box local-path="rightBondary" v-model="rightBoundaryModel" />
						<label for="rightBoundary" class="ml-2"> Right Break </label>
					</p-input-group>
					<div class="command-preview pt-1">
						{{ previewString }}
					</div>
				</p-tab-panel>
				<p-tab-panel value="regex">
					<command-match-input label="Regex" v-model="matchModel" />
					<div class="command-preview pt-1">
						{{ previewString }}
					</div>
				</p-tab-panel>
			</p-tab-panels>
		</p-tabs>
	</div>
</template>

<script setup lang="ts">
import PTabs from "primevue/tabs"
import PTab from "primevue/tab"
import PTabList from "primevue/tablist"
import PTabPanels from "primevue/tabpanels"
import PTabPanel from "primevue/tabpanel"

import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import PInputGroup from "primevue/inputgroup"
import { Command, CommandMode, SchemaCommand, StringModeCommand, getCommandInfoString } from "castmate-schema"
import { computed, ref, useModel } from "vue"
import LabelFloater from "../base-components/LabelFloater.vue"
import { SharedDataInputProps } from "../DataInputTypes"
import CommandArgumentEdit from "../base-components/commands/CommandArgumentEdit.vue"
import {
	DraggableCollection,
	useDataBinding,
	useDataUIBinding,
	useDefaultableModel,
	useUndoCommitter,
} from "../../../main"
import { nanoid } from "nanoid/non-secure"
import CCheckBox from "../base-components/CCheckBox.vue"

import CommandMatchInput from "../base-components/commands/CommandMatchInput.vue"

const props = defineProps<
	{
		modelValue: Command | undefined
		schema: SchemaCommand
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const defaultCommand = () => Command.factoryCreate()

const matchModel = useDefaultableModel(model, "match", "", defaultCommand)
const tabModel = useUndoCommitter(useDefaultableModel(model, "mode", "command", defaultCommand))

const leftBoundaryModel = useUndoCommitter(
	//@ts-ignore
	useDefaultableModel<StringModeCommand, "leftBoundary">(model, "leftBoundary", false, defaultCommand)
)

const rightBoundaryModel = useUndoCommitter(
	//@ts-ignore
	useDefaultableModel<StringModeCommand, "rightBoundary">(model, "rightBoundary", false, defaultCommand)
)

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

const matchInput = ref<{ $el: HTMLElement }>()

useDataUIBinding({
	focus() {
		console.log(matchInput.value?.$el)
		matchInput.value?.$el.focus()
	},
	scrollIntoView() {
		matchInput.value?.$el.scrollIntoView()
	},
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

.command-input :deep(.p-tabview-tablist li .p-tabview-tab-header) {
	padding: 0.25rem 0.5rem;
}

.command-input :deep(.p-tabview .p-tabview-panels) {
	padding: 0.75rem;
}

.small-tab {
	padding: 0.5rem;
}
</style>
