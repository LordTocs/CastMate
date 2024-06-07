<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { useSlots } from "vue"
import { provideDocumentPath } from "../../util/document"

const props = defineProps<{
	localPath?: string
}>()

provideDocumentPath(() => props.localPath)
</script>
