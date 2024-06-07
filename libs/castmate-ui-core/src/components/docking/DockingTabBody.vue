<template>
	<document-editor v-if="props.modelValue.documentId" :document-id="props.modelValue.documentId" class="tab" />
	<component
		v-else-if="props.modelValue.page"
		:is="modelValue.page"
		class="tab"
		:page-data="props.modelValue.pageData"
	/>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { type DockedTab } from "../../util/docking"
import DocumentEditor from "../document/DocumentEditor.vue"

const props = defineProps<{
	modelValue: DockedTab
}>()

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)
</script>

<style scoped>
.tab {
	display: flex;
	background-color: var(--surface-a);
	flex: 1;
}
</style>
