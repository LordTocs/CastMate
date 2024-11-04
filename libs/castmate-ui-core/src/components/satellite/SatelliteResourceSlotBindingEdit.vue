<template>
	<data-input v-if="slot && resourceDataSchema" :schema="resourceDataSchema" v-model="resourceId" />
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useResourceSlotBinding, useResourceSlotBindingModel } from "../../satellite/satellite-resources"
import DataInput from "../data/DataInput.vue"
import { Schema } from "castmate-schema"
import { ResourceProxyFactory } from "../../main"

const props = defineProps<{
	slotId: string
}>()

const resourceDataSchema = computed<Schema | undefined>(() => {
	if (!slot.value) return undefined

	return {
		type: ResourceProxyFactory,
		resourceType: slot.value.resourceType,
		required: false,
		name: slot.value.name,
	}
})

const slot = useResourceSlotBinding(() => props.slotId)
const resourceId = useResourceSlotBindingModel(() => props.slotId)
</script>
