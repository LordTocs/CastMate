<template>
	<div class="tab">
		<component :is="documentComponent" v-if="documentComponent && document" v-model="document.data" />
	</div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { type DockedTab } from "../../util/docking"
import { useDocument, useDocumentComponent } from "../../util/document"

const props = defineProps<{
	modelValue: DockedTab
}>()

const document = useDocument(props.modelValue.documentId)
const documentComponent = useDocumentComponent(document.value?.type)

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)
</script>

<style scoped>
.tab {
	display: relative;
	background-color: var(--surface-a);
	flex: 1;
}
</style>
