<template>
	<span class="p-float-label">
		<p-auto-complete
			id="ac"
			v-model="modelObj"
			option-label="trigger"
			class="w-full"
			:suggestions="suggestions"
			@complete="search"
			dropdown
		>
			<template #option="slotProps">
				<div class="flex align-options-center">
					{{ (slotProps.option as TriggerValue).plugin + "." + (slotProps.option as TriggerValue).trigger }}
				</div>
			</template>
		</p-auto-complete>
		<label for="ac"> {{ label }} </label>
	</span>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import PAutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete"
import { usePluginStore } from "../../plugins/plugin-store"
import { useVModel } from "@vueuse/core"

const pluginStore = usePluginStore()

interface TriggerValue {
	plugin: string
	trigger: string
}

const props = withDefaults(
	defineProps<{
		modelValue: TriggerValue | undefined
		label: string
	}>(),
	{ label: "Trigger" }
)
const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)

const triggers = computed(() => {
	const result = []
	for (let plugin of pluginStore.pluginMap.values()) {
		for (let triggerKey in plugin.triggers) {
			result.push({
				plugin: plugin.id,
				trigger: triggerKey,
			})
		}
	}

	return result
})

const suggestions = ref<TriggerValue[]>([])

function search(event: AutoCompleteCompleteEvent) {
	if (!event.query.trim().length) {
		suggestions.value = [...triggers.value]
		return
	}

	const lowerQuery = event.query.toLowerCase()

	const searched = triggers.value.filter((t) => {
		return t.trigger.toLowerCase().includes(lowerQuery)
	})

	suggestions.value = searched
}
</script>
