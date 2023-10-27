<template>
	{{ resource?.config?.name }}
</template>

<script setup lang="ts">
import { ResourceData } from "castmate-schema"
import { useResource } from "../../../main"

const props = defineProps<{
	resourceId: string
	resourceType: string
}>()

const resource = useResource(
	() => props.resourceType,
	() => props.resourceId
)
</script>
