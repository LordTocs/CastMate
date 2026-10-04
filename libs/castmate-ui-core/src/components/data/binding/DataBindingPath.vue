<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { useSlots } from "vue"
import { provideLocalPath } from "../../../editor/data-binding"

const props = defineProps<{
	localPath?: string
}>()

provideLocalPath(() => props.localPath)
</script>
