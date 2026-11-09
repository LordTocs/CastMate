<template>
	<nav-project-document v-if="isDocumentInfo(info)" :info="info" />
	<nav-project-folder v-else-if="isDocumentFolderInfo(info)" :info="info" />
</template>
<script setup lang="ts">
import { isDocumentInfo, ProjectTreeNode, isDocumentFolderInfo } from "castmate-schema"
import NavProjectDocument from "./NavProjectDocument.vue"
import NavProjectFolder from "./NavProjectFolder.vue"

const props = defineProps<{
	info: ProjectTreeNode
}>()
</script>
