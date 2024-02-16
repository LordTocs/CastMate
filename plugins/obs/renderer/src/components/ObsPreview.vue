<template>
	<img :src="previewImage" v-if="previewImage" />
</template>

<script setup lang="ts">
import { useObsProgramPreview } from "../preview-store"

const props = defineProps<{
	obsId?: string
}>()

const previewImage = useObsProgramPreview(() => props.obsId)
</script>

<style scoped></style>
