<template>
	<c-autocomplete
		v-model="idModel"
		:items="triggers"
		group-prop="plugin"
		input-id="trigger"
		:required="true"
		no-float
		:label="label"
	>
		<template #selectedItem="{ item }">
			<i :class="item?.icon" :style="{ color: item?.color }"></i>
			{{ item?.name }}
		</template>

		<template #groupHeader="{ item }">
			<li
				class="header text-center mb-1 pb-2"
				:style="{ borderBottom: `solid 2px ${pluginStore.pluginMap.get(item.plugin)?.color}` }"
			>
				<i
					v-if="pluginStore.pluginMap.get(item.plugin)?.icon"
					:class="pluginStore.pluginMap.get(item.plugin)?.icon"
					class="mr-1"
					:style="{ color: pluginStore.pluginMap.get(item.plugin)?.color }"
				></i
				>{{ pluginStore.pluginMap.get(item.plugin)?.name }}
			</li>
		</template>

		<template #item="{ item, focused, highlighted, onClick }">
			<li
				class="p-dropdown-item"
				:class="{ 'p-focus': focused, 'p-highlight': highlighted }"
				:data-p-highlight="highlighted"
				:data-p-focused="focused"
				:aria-label="item.name"
				:aria-selected="highlighted"
				@click="onClick"
			>
				<i :class="item?.icon" :style="{ color: item?.color }"></i> {{ item.name }}
			</li>
		</template>
	</c-autocomplete>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { usePluginStore } from "../../plugins/plugin-store"
import { useVModel } from "@vueuse/core"
import { useTrigger } from "../../main"
import CAutocomplete from "../data/base-components/CAutocomplete.vue"

const pluginStore = usePluginStore()

interface TriggerValue {
	plugin: string
	trigger: string
}

const props = withDefaults(
	defineProps<{
		modelValue: TriggerValue | undefined
		label?: string
	}>(),
	{}
)
const emit = defineEmits(["update:modelValue"])
const model = useVModel(props, "modelValue", emit)

const selectedTrigger = useTrigger(() => props.modelValue)

const idModel = computed({
	get() {
		if (props.modelValue) {
			return props.modelValue.plugin + "." + props.modelValue.trigger
		}
		return undefined
	},
	set(v) {
		if (!v) {
			model.value = undefined
			return
		}

		const [plugin, trigger] = v.split(".")
		model.value = {
			plugin,
			trigger,
		}
	},
})

interface TriggerItem {
	id: string
	plugin: string
	name: string
	icon?: string
	color: string
}
const triggers = computed(() => {
	const result: TriggerItem[] = []
	for (let plugin of pluginStore.pluginMap.values()) {
		for (let triggerKey in plugin.triggers) {
			const trigger = plugin.triggers[triggerKey]

			result.push({
				id: `${plugin.id}.${triggerKey}`,
				plugin: plugin.id,
				name: trigger.name,
				icon: trigger.icon,
				color: trigger.color,
			})
		}
	}
	return result
})
</script>

<style scoped>
.header {
	font-weight: 600;
	color: #e6e6e6;
}
</style>
