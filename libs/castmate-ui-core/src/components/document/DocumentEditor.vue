<template>
	<component
		:is="documentComponent"
		v-if="documentComponent && document"
		v-model="documentData"
		v-model:view="documentView"
		tabindex="-1"
	/>
</template>

<script setup lang="ts">
import { computed, watch } from "vue"
import { provideDocument, useDocument, useDocumentComponent, useDocumentStore } from "../../main"

const props = defineProps<{
	documentId: string
}>()

const document = useDocument(() => props.documentId)
const documentStore = useDocumentStore()
const documentComponent = useDocumentComponent(document.value?.type)
provideDocument(() => props.documentId)

const documentData = computed({
	get() {
		return document.value?.data
	},
	set(data) {
		if (!document.value) return
		if (!data) return

		document.value.dirty = true
		document.value.data = data
	},
})

watch(
	documentData,
	() => {
		if (document.value) {
			document.value.dirty = true
		}
	},
	{ deep: true }
)

const documentView = computed({
	get() {
		return document.value?.viewData
	},
	set(data) {
		if (!document.value) return

		if (!data) return

		document.value.viewData = data
	},
})
</script>

<style scoped></style>
