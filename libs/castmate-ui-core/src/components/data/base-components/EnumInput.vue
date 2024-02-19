<template>
	<c-autocomplete
		v-model="model"
		:required="!!schema.required"
		:items="items"
		text-prop="name"
		:input-id="inputId"
		@open="onOpen"
		:placeholder="placeholder"
		:errorMessage="errorMessage"
	/>
</template>

<script setup lang="ts">
import { Enumable, EnumItem, Schema } from "castmate-schema"
import { computed, onMounted, ref, useModel } from "vue"
import _isFunction from "lodash/isFunction"
import { isObject } from "@vueuse/core"
import CAutocomplete from "./CAutocomplete.vue"

const props = defineProps<{
	modelValue: any
	schema: Schema
	placeholder?: string
	inputId?: string
	context?: any
	errorMessage?: string
}>()

const model = useModel(props, "modelValue")

const dynamicItems = ref<EnumItem<any>[]>([])
const fetching = ref(false)

async function fetchItems() {
	const enumable = props.schema as Enumable<any>
	if (!enumable.enum) return
	if (!_isFunction(enumable.enum)) return

	console.log("Do Fetch!")
	fetching.value = true
	try {
		const result = await enumable.enum(props.context)
		dynamicItems.value = result
		console.log(result)
	} catch (err) {
		console.error(err)
	}
	fetching.value = false
}

function onOpen() {
	fetchItems()
}

function toAutoComplete(item: EnumItem<any>): { id: any; name: string } {
	if (isObject(item) && "value" in item && "name" in item) {
		return { id: item.value, name: item.name as string }
	} else {
		return { id: item, name: String(item) }
	}
}

const items = computed<{ id: any; name: string }[]>(() => {
	const enumable = props.schema as Enumable<any>
	if (!enumable.enum) return []
	if (_isFunction(enumable.enum)) {
		return dynamicItems.value.map((i) => toAutoComplete(i as EnumItem<any>))
	} else {
		return enumable.enum.map((i) => toAutoComplete(i))
	}
})

onMounted(() => {
	onOpen()
})
</script>
