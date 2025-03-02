<template>
	<div style="min-width: 40vh">
		<data-input
			v-if="resourceData?.configSchema"
			:schema="resourceData.configSchema"
			v-model="model"
			:local-path="localPath"
		/>
		<div v-else>SCHEMA MISSING</div>
	</div>
</template>

<script setup lang="ts">
import { useModel } from "vue"
import DataInput from "../data/DataInput.vue"
import { useResourceData } from "../../main"

const props = withDefaults(
	defineProps<{
		modelValue: any
		resourceId: string
		resourceType: string
		localPath?: string
	}>(),
	{
		localPath: "",
	}
)

const resourceData = useResourceData(() => props.resourceType)

const model = useModel(props, "modelValue")
</script>
