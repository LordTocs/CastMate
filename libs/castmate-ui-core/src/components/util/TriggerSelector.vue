<template>
	<span class="p-float-label trigger-selector" @mousedown="onMouseDown">
		<p-drop-down
			id="ac"
			v-model="modelObj"
			:options="options"
			option-value="value"
			option-label="label"
			option-group-label="label"
			option-group-children="triggers"
			class="w-full"
			dropdown
		>
			<template #value="slotProps">
				<div v-if="slotProps.value">
					<i :class="selectedTrigger?.icon" :style="{ color: selectedTrigger?.color }" />
					{{ selectedTrigger?.name }}
				</div>
				<div v-else>
					<i />
				</div>
			</template>
			<template #optiongroup="slotProps">
				<div
					class="flex justify-content-center"
					:style="{ borderBottom: `2px solid ${slotProps.option.color}` }"
				>
					<i :class="slotProps.option.icon" :style="{ color: slotProps.option.color }" />
					{{ slotProps.option.label }}
				</div>
			</template>
			<template #option="slotProps">
				<div>
					<i :class="slotProps.option.icon" :style="{ color: slotProps.option.color }" />
					{{ slotProps.option.label }}
				</div>
			</template>
		</p-drop-down>
		<label for="ac" v-if="label"> {{ label }} </label>
	</span>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import PDropDown from "primevue/dropdown"
import { usePlugin, usePluginStore } from "../../plugins/plugin-store"
import { useVModel } from "@vueuse/core"
import { useTrigger } from "../../main"

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
const modelObj = useVModel(props, "modelValue", emit)

const selectedTrigger = useTrigger(() => props.modelValue)

const options = computed(() => {
	const result: any[] = []
	for (let plugin of pluginStore.pluginMap.values()) {
		const pluginOption = {
			label: plugin.name,
			color: plugin.color,
			icon: plugin.icon,
			id: plugin.id,
			triggers: [] as any[],
		}
		for (let triggerKey in plugin.triggers) {
			const trigger = plugin.triggers[triggerKey]
			pluginOption.triggers.push({
				label: trigger.name,
				color: trigger.color,
				id: trigger.id,
				icon: trigger.icon,
				value: { plugin: plugin.id, trigger: trigger.id },
			})
		}
		if (pluginOption.triggers.length > 0) {
			result.push(pluginOption)
		}
	}

	return result
})

function onMouseDown(ev: MouseEvent) {
	ev.stopPropagation()
}
</script>

<style scoped></style>
