<template>
	<v-autocomplete
		v-model="modelObj"
		:items="enumItems"
		:label="label"
		:clearable="clearable"
		:density="density"
		item-value="value"
		item-title="name"
		:menu-props="{ maxHeight: 200, location: 'bottom' }"
		@focus="fetchItems"
	>
		<template #append-inner>
			<slot name="append-inner"> </slot>
		</template>
	</v-autocomplete>
</template>

<script setup>
import { ipcRenderer } from "electron"
import { useModel } from "../../../utils/modelValue"
import _cloneDeep from "lodash/cloneDeep"
import { ref, computed, onMounted } from "vue"

const props = defineProps({
	modelValue: {},
	enum: {},
	queryMode: { type: Boolean, default: false },
	density: {},
	label: {},
	clearable: {},
	context: {},
})
const emit = defineEmits(["update:modelValue"])
const modelObj = useModel(props, emit)

const loading = ref(false)
const isDynamicEnum = computed(
	() => typeof props.enum == "string" || props.enum instanceof String
)
const dynamicEnumItems = ref([])
const enumItems = computed(() =>
	isDynamicEnum.value ? dynamicEnumItems.value : props.enum
)
async function fetchItems() {
	if (!isDynamicEnum.value)
		return

	loading.value = true
	try {
		dynamicEnumItems.value = await ipcRenderer.invoke(
			props.enum,
			_cloneDeep(props.context)
		)
	} catch (err) {
		console.error("Error getting enum items from main process", err)
	}
	finally {
		loading.value = false
	}
}

onMounted(() => {
	fetchItems()
})
</script>

<style></style>
