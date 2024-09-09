<template>
	<c-autocomplete v-model="model" :items="items" :required="required" text-prop="name" :placeholder="placeholder">
	</c-autocomplete>
</template>

<script setup lang="ts">
import { useViewerDataStore } from "../../viewer-data/viewer-data-store"
import CAutocomplete from "../data/base-components/CAutocomplete.vue"
import { computed, useModel } from "vue"

const props = withDefaults(
	defineProps<{
		modelValue: string | undefined
		required?: boolean
		placeholder?: string
	}>(),
	{
		required: false,
		placeholder: "Viewer Variable",
	}
)

const model = useModel(props, "modelValue")

const viewerDataStore = useViewerDataStore()

const items = computed(() => {
	return [...viewerDataStore.variables.keys()].map((k) => ({ id: k, name: k }))
})
</script>
