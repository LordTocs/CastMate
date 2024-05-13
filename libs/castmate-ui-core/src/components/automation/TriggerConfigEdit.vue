<template>
	<div v-if="triggerInfo">
		<div class="trigger-header">
			<h3>
				<i v-if="triggerInfo.icon" :class="triggerInfo.icon" :style="{ color: triggerInfo.color }" />{{
					triggerInfo.name
				}}
			</h3>
			<p v-if="triggerInfo.description">{{ triggerInfo.description }}</p>
		</div>
		<data-input v-model="model.config" :schema="triggerInfo.config" />
		<p-divider />
		<div
			class="p-inputgroup px-4"
			v-bind="$attrs"
			v-tooltip="'Prevent more triggers in this profile from running after this one.'"
		>
			<p-check-box binary input-id="check" v-model="model.stop" />
			<label for="check" class="ml-2"> Trigger Stop </label>
		</div>
	</div>
	<div v-else></div>
</template>

<script setup lang="ts">
import { TriggerData } from "castmate-schema"
import { useTrigger, DataInput } from "../../main"
import { useModel } from "vue"

import PDivider from "primevue/divider"
import PCheckBox from "primevue/checkbox"

const props = defineProps<{
	modelValue: { plugin?: string; trigger?: string; config?: any; stop?: boolean }
}>()

const model = useModel(props, "modelValue")

const triggerInfo = useTrigger(() => props.modelValue)
</script>

<style scoped>
.trigger-header {
	padding-left: 0.5rem;
	padding-right: 0.5rem;
	padding-top: 0.5rem;
}

.trigger-header p {
	margin: 0;
	font-size: 0.8em;
}

.trigger-header h3 {
	margin: 0;
	text-align: center;
}

.trigger-header h3 i {
	margin-right: 0.3em;
}
</style>
