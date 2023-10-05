<template>
	<c-autocomplete
		v-model="model"
		:required="!!schema.required"
		:label="schema.name"
		text-prop="config.name"
		:items="resourceItems ?? []"
		input-id="resource"
		:no-float="noFloat"
	/>
</template>

<script setup lang="ts">
import { SchemaResource, ResourceData } from "castmate-schema"
import { ResourceProxy } from "../../../util/data"
import { computed, nextTick, ref, useModel, watch } from "vue"
import { useResources } from "../../../main"

import _clamp from "lodash/clamp"
import { SharedDataInputProps } from "../DataInputTypes"

import CAutocomplete from "../base-components/CAutocomplete.vue"

const props = defineProps<
	{
		schema: SchemaResource
		modelValue: ResourceProxy | undefined
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")
const resourceStore = useResources(() => props.schema.resourceType)

const resourceItems = computed(() => {
	const resourceMap = resourceStore.value?.resources
	if (!resourceMap) return undefined
	return [...resourceMap.values()]
})
</script>

<style scoped>
.container {
	display: inline-flex;
	cursor: pointer;
	position: relative;
	user-select: none;
}

.overlay {
	position: absolute;
	max-height: 25rem;
	overflow-y: auto;
}
</style>
