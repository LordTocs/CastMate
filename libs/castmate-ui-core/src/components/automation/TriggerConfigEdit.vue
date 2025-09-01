<template>
	<div v-if="triggerInfo" class="pb-4">
		<div class="trigger-header">
			<h3>
				<i v-if="triggerInfo.icon" :class="triggerInfo.icon" :style="{ color: triggerInfo.color }" />{{
					triggerInfo.name
				}}
			</h3>
			<p v-if="triggerInfo.description">{{ triggerInfo.description }}</p>
		</div>
		<data-input v-model="model.config" :schema="triggerInfo.config" local-path="config" />
		<p-divider />
		<div class="p-inputgroup" v-tooltip="'Prevent more triggers in this profile from running after this one.'">
			<p-check-box binary input-id="check" v-model="model.stop" />
			<label for="check" class="ml-2"> Trigger Stop </label>
		</div>
		<p-divider />
		<label class="text-color-secondary text-sm">Test Data</label>
		<data-input v-model="model.testContext" :schema="contextSchema" local-path="testConfig" />
	</div>
	<div v-else></div>
</template>

<script setup lang="ts">
import { addDefaults, constructDefault, isObjectSchema, TriggerData } from "castmate-schema"
import { useTrigger, DataInput, injectDataContextSchema } from "../../main"
import { useModel, watch } from "vue"

import PDivider from "primevue/divider"
import PCheckBox from "primevue/checkbox"

const props = defineProps<{
	modelValue: { plugin?: string; trigger?: string; config?: any; stop?: boolean; testContext?: any }
}>()

const model = useModel(props, "modelValue")

const triggerInfo = useTrigger(() => props.modelValue)

const contextSchema = injectDataContextSchema()

watch(contextSchema, async (newSchema, oldSchema) => {
	if (!model.value.testContext) {
		model.value.testContext = await constructDefault(newSchema)
	} else if (isObjectSchema(newSchema)) {
		await addDefaults(newSchema, model.value.testContext)
	}
})
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
