<template>
	<drop-down-panel
		:container="container"
		v-model="open"
		:style="{
			overflowY: 'auto',
			maxHeight: '15rem',
		}"
	>
		<ul class="p-dropdown-items">
			<li
				v-for="suggestion in suggestions"
				class="p-dropdown-item"
				:class="{ 'p-focus': isFocused(suggestion) }"
				:data-p-focused="isFocused(suggestion)"
				:aria-label="suggestion.id"
				@click="onSuggestionClick($event, suggestion)"
			>
				<state-list-item v-if="suggestion.plugin != null" :model-value="suggestion" />
			</li>
		</ul>
	</drop-down-panel>
</template>

<script setup lang="ts">
import { computed, ref, useModel } from "vue"
import DropDownPanel from "../DropDownPanel.vue"
import { usePluginStore, TriggerSelection } from "../../../../main"
import StateListItem from "../state/StateListItem.vue"

const props = defineProps<{
	open: boolean
	container: HTMLElement | undefined
	trigger?: TriggerSelection
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
	plugin: string
}

const suggestions = computed(() => {
	const result: Suggestion[] = []

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
</script>
