<template>
	<span class="data-label" v-if="schema.name">{{ schema.name }}: </span>{{ dataView }}
</template>

<script setup lang="ts">
import { SchemaBase, Enumable, EnumItem } from "castmate-schema"
import { SharedDataViewProps } from "../../../main"
import { computed, ref, watch, onMounted } from "vue"
import _isFunction from "lodash/isFunction"

const props = defineProps<
	{
		modelValue: any
		schema: SchemaBase & Enumable<any>
	} & SharedDataViewProps
>()

const fetching = ref(false)

const dynamicItem = ref<EnumItem<any>>()

function findItem(arr: Array<EnumItem<any>>) {
	return arr.find((v) => {
		if (typeof v == "object" && "value" in v) return v.value == props.modelValue
		return v == props.modelValue
	})
}

onMounted(() => {
	watch(
		() => props.modelValue,
		() => {
			fetchItem()
		},
		{ immediate: true }
	)
})

//TODO: Is there a better way to
async function fetchItem() {
	const enumable = props.schema as Enumable<any>
	if (!enumable.enum) return

	if (!_isFunction(enumable.enum)) {
		const item = findItem(enumable.enum)
		dynamicItem.value = item
		return
	}

	console.log("Do Fetch ITEM!")
	fetching.value = true
	try {
		const items = await enumable.enum(props.context)
		console.log("ITEMS", items, props.context)
		const item = findItem(items)
		dynamicItem.value = item
		return
	} catch (err) {
		console.error("FETCH ERROR", err)
	}
	fetching.value = false
}

const dataView = computed(() => {
	if (props.schema.enum == null) return props.modelValue
	return dynamicItem.value?.name ?? dynamicItem.value ?? props.modelValue
})
</script>
