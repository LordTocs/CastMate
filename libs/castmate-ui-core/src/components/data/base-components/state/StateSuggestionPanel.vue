<template>
	<drop-down-panel
		:container="container"
		v-model="open"
		:style="{
			overflowY: 'auto',
			maxHeight: '15rem',
		}"
		side="right"
	>
		<ul class="p-select-list">
			<li
				v-for="suggestion in suggestions"
				class="p-select-option"
				:class="{ 'p-focus': isFocused(suggestion) }"
				:data-p-focused="isFocused(suggestion)"
				:aria-label="suggestion.id"
				@click="onSuggestionClick($event, suggestion)"
				@mousedown="onMouseDown"
			>
				<state-list-item :model-value="suggestion" />
			</li>
		</ul>
	</drop-down-panel>
</template>

<script setup lang="ts">
import { ComputedRef, computed, inject, ref, useModel } from "vue"
import DropDownPanel from "../DropDownPanel.vue"
import { usePluginStore, TriggerSelection, injectDataContextSchema } from "../../../../main"
import StateListItem from "../state/StateListItem.vue"

const props = defineProps<{
	open: boolean
	container: HTMLElement | undefined
}>()

const emit = defineEmits(["update:open", "suggest"])

const open = useModel(props, "open")
const focusId = ref<string>()
function isFocused(suggestion: Suggestion) {
	return suggestion.id == focusId.value
}

const pluginStore = usePluginStore()

interface Suggestion {
	id: string
	state: string
	plugin?: string
}

const dataContext = injectDataContextSchema()
const flowVariables = inject<ComputedRef<string[]>>(
	"flowVariables",
	computed(() => [])
)

const suggestions = computed(() => {
	const result: Suggestion[] = []

	const contextSchema = dataContext.value

	if (contextSchema.type == Object && "properties" in contextSchema) {
		for (const propKey in contextSchema.properties) {
			const prop = contextSchema.properties[propKey]
			result.push({
				id: propKey,
				state: propKey,
			})
		}
	}

	for (const flowVar of flowVariables.value) {
		result.push({
			id: flowVar,
			state: flowVar,
		})
	}

	for (const plugin of pluginStore.pluginMap.values()) {
		for (const key in plugin.state) {
			result.push({
				id: `${plugin.id}.${key}`,
				state: key,
				plugin: plugin.id,
			})
		}
	}

	return result
})

function onSuggestionClick(ev: MouseEvent, suggestion: Suggestion) {
	emit("suggest", suggestion.id)
	open.value = false
	ev.stopPropagation()
	ev.preventDefault()
}

function onMouseDown(ev: MouseEvent) {
	ev.stopPropagation()
	ev.preventDefault()
}
</script>
