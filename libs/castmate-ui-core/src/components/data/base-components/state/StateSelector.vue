<template>
	<label-floater :no-float="noFloat" :label="label" :input-id="inputId" v-slot="labelProps">
		<c-autocomplete
			v-model="idModel"
			:items="items"
			:required="required"
			:label="label"
			group-prop="plugin"
			:no-float="noFloat"
			v-bind="labelProps"
		>
			<template #selectedItem="{ item }">
				<state-list-item v-if="item" :model-value="(item as any)" />
				<span v-else>&nbsp;</span>
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
				<drop-list-item
					@click="onClick"
					:focused="focused"
					:highlighted="highlighted"
					:label="`${item.plugin}.${item.state}`"
				>
					<state-list-item :model-value="(item as any)" />
				</drop-list-item>
			</template>
		</c-autocomplete>
	</label-floater>
</template>

<script setup lang="ts">
import { computed, useModel } from "vue"
import CAutocomplete from "../CAutocomplete.vue"
import { usePluginStore } from "../../../../plugins/plugin-store"
import StateListItem from "./StateListItem.vue"
import LabelFloater from "../LabelFloater.vue"
import DropListItem from "../DropListItem.vue"
import { useDataBinding } from "../../../../main"

const props = defineProps<{
	modelValue: { plugin: string | undefined; state: string | undefined } | undefined
	required: boolean
	inputId: string
	label?: string
	noFloat?: boolean
	localPath: string
}>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const idModel = computed({
	get() {
		if (!model.value) return undefined
		return `${model.value.plugin}.${model.value.state}`
	},
	set(v) {
		if (!v) {
			model.value = undefined
			return
		}
		const [plugin, state] = v.split(".")
		model.value = {
			plugin,
			state,
		}
	},
})

const pluginStore = usePluginStore()
const items = computed(() => {
	const result: { id: string; plugin: string; state: string }[] = []

	for (const plugin of pluginStore.pluginMap.values()) {
		for (const stateKey in plugin.state) {
			result.push({
				id: `${plugin.id}.${stateKey}`,
				plugin: plugin.id,
				state: stateKey,
			})
		}
	}

	return result
})
</script>

<style scoped></style>
