<template>
	<div class="trigger-card">
		<div class="header">
			<i class="mdi mdi-drag" style="font-size: 2.5rem; line-height: 2.5rem" />
			<div class="flex flex-row flex-grow-1 align-items-center">
				<span class="trigger-name">
					{{ trigger?.name }}
				</span>
			</div>
			<p-button :icon="open ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'" @click="open = !open" />
		</div>
		<div class="body" v-if="open">
			<div class="config">
				<trigger-selector v-model="triggerModel" class="mb-4 mt-4" />
				<template v-if="trigger">
					<data-input :schema="trigger.config" v-model="config" />
				</template>
			</div>
			<div class="automation"></div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import PButton from "primevue/button"
import { type TriggerData } from "castmate-schema"
import { useTrigger, DataInput, TriggerSelector } from "castmate-ui-core"

const open = ref(false)

const config = ref(undefined)

const props = defineProps<{
	modelValue: TriggerData
}>()

const triggerModel = computed({
	get() {
		if (!props.modelValue.plugin || !props.modelValue.trigger) return undefined
		return { plugin: props.modelValue.plugin, trigger: props.modelValue.trigger }
	},
	set(value) {
		const newValue = { ...props.modelValue, ...value }
		if (!value) {
			delete newValue.trigger
			delete newValue.plugin
		}
		emit("update:modelValue", newValue)
	},
})

const trigger = useTrigger(() => props.modelValue)

const emit = defineEmits(["update:modelValue"])

//const plugin = usePlugin(props.modelValue.plugin)
</script>

<style scoped>
.trigger-card {
	border: 2px solid var(--surface-c);
	border-radius: var(--border-radius);
	background-color: var(--surface-a);

	display: flex;
	flex-direction: column;
}

.header {
	background-color: var(--surface-b);

	display: flex;
	flex-direction: row;
}

.body {
	display: flex;
	flex-direction: row;
}

.config {
	background-color: var(--surface-b);
	min-height: 300px;
	flex: 1;
}

.automation {
	flex: 1;
}

.trigger-name {
	user-select: none;
	line-height: 1rem;
}
</style>
