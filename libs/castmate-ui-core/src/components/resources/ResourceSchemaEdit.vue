<template>
	<data-input v-if="resourceData?.configSchema" :schema="resourceData.configSchema" v-model="model" />
	<div v-else>SCHEMA MISSING</div>
</template>

<script setup lang="ts">
import { useModel } from "vue"
import DataInput from "../data/DataInput.vue"
import { useResourceData } from "../../main"

const props = defineProps<{
	modelValue: any
	resourceId: string
	resourceType: string
}>()

const resourceData = useResourceData(() => props.resourceType)

const model = useModel(props, "modelValue")
</script>
