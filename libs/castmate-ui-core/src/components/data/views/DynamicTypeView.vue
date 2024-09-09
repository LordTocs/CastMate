<template>
	<data-view v-if="dynamicSchema" :model-value="modelValue" :schema="dynamicSchema" :context="context" />
</template>

<script setup lang="ts">
import { SchemaDynamicType, Schema } from "castmate-schema"
import { SharedDataViewProps } from "../../../main"
import { ref, watch, onMounted } from "vue"
import DataView from "../DataView.vue"
const props = defineProps<
	{
		modelValue: any
		schema: SchemaDynamicType
	} & SharedDataViewProps
>()

const dynamicSchema = ref<Schema>()

async function queryDynamicSchema() {
	const response = await props.schema.dynamicType(props.context)
	dynamicSchema.value = response
}

onMounted(() => {
	watch(
		() => props.context,
		() => {
			queryDynamicSchema()
		},
		{ deep: true, immediate: true }
	)
})
</script>
