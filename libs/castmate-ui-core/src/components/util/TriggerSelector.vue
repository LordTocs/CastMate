<template>
	<label-floater label="Trigger" input-id="trigger" v-slot="labelProps">
		<c-autocomplete
			v-model="idModel"
			:items="triggers"
			group-prop="plugin"
			text-prop="name"
			:required="true"
			no-float
			v-bind="labelProps"
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
				<drop-list-item :highlighted="highlighted" :focused="focused" @click="onClick" :label="item.name">
					<i :class="item?.icon" :style="{ color: item?.color }"></i> {{ item.name }}
				</drop-list-item>
			</template>
		</c-autocomplete>
	</label-floater>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { usePluginStore } from "../../plugins/plugin-store"
import { LabelFloater, useDataBinding, useTrigger } from "../../main"
import CAutocomplete from "../data/base-components/CAutocomplete.vue"
import DropListItem from "../data/base-components/DropListItem.vue"

const pluginStore = usePluginStore()

interface TriggerValue {
	plugin: string
	trigger: string
}

const model = defineModel<TriggerValue>()

useDataBinding(() => "trigger")

const props = withDefaults(
	defineProps<{
		label?: string
	}>(),
	{}
)

const selectedTrigger = useTrigger(() => model.value)

const idModel = computed({
	get() {
		if (model.value) {
			return model.value.plugin + "." + model.value.trigger
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
