<template>
	<span class="data-label">{{ schema.name }}: </span>
	<component :is="resourceView" :resource-id="modelValue" :resource-type="props.schema.resourceType" />
</template>

<script setup lang="ts">
import { SchemaResource } from "castmate-schema"
import { SharedDataViewProps } from "../DataInputTypes"
import { useResourceData, useResourceStore } from "../../../main"
import GenericResourceView from "../base-components/GenericResourceView.vue"
import { computed } from "vue"
const props = defineProps<
	{
		modelValue: string
		schema: SchemaResource
	} & SharedDataViewProps
>()

const resourceData = useResourceData(() => props.schema.resourceType)

const resourceView = computed(() => resourceData.value?.viewComponent ?? GenericResourceView)
</script>
