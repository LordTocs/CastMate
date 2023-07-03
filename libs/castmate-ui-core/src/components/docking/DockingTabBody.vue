<template>
	<document-editor :document-id="props.modelValue.documentId" class="tab" />
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
