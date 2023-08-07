<template>
	<project-group v-if="'items' in groupOrItem" :group="groupOrItem" />
	<project-item v-else :item="groupOrItem" />
</template>

<script setup lang="ts">
import { ProjectGroupItem } from "castmate-ui-core"

import ProjectGroup from "./ProjectGroup.vue"
import ProjectItem from "./ProjectItem.vue"

const props = defineProps<{
	groupOrItem: ProjectGroupItem
}>()
</script>
