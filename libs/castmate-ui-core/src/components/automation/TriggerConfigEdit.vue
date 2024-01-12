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
	</div>
	<div v-else>ERROR</div>
</template>

<script setup lang="ts">
import { TriggerData } from "castmate-schema"
import { useTrigger, DataInput } from "../../main"
import { useModel } from "vue"

const props = defineProps<{
	modelValue: { plugin?: string; trigger?: string; config?: any }
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
