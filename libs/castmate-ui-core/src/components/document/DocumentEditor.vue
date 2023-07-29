<template>
	<component
		:is="documentComponent"
		v-if="documentComponent && document"
		v-model="documentData"
		v-model:view="documentView"
	/>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useDocument, useDocumentComponent } from "../../main"

const props = defineProps<{
	documentId: string
}>()

const document = useDocument(() => props.documentId)
const documentComponent = useDocumentComponent(document.value?.type)

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
