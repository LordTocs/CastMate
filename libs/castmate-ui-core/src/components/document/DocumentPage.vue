<template>
	<component
		:is="documentComponent"
		v-if="documentComponent && document"
		v-model="documentData"
		tabindex="-1"
		:pageData="pageData"
	/>
</template>

<script setup lang="ts">
import { computed, watch } from "vue"
import { provideBaseDataBinding, useDocument, useDocumentComponent } from "../../main"

const props = defineProps<{
	pageData: { documentId: string; documentType: string } & Record<string, any>
}>()

const document = useDocument(() => props.pageData.documentId)
const documentComponent = useDocumentComponent(document.value?.plugin, document.value?.type)
//provideDocument(() => props.pageData.documentId)

provideBaseDataBinding(() => document.value)

const documentData = computed({
	get() {
		return document.value?.documentData
	},
	set(data) {
		if (!document.value) return
		if (!data) return

		document.value.dirty = true
		document.value.documentData = data
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
</script>
