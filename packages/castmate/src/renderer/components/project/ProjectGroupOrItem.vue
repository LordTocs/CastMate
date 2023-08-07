<template>
	<project-group v-if="'items' in groupOrItem" :group="groupOrItem" :indent="indent" />
	<project-item v-else :item="groupOrItem" :indent="indent" />
</template>

<script setup lang="ts">
import { ProjectGroupItem } from "castmate-ui-core"

import ProjectGroup from "./ProjectGroup.vue"
import ProjectItem from "./ProjectItem.vue"
const props = withDefaults(
	defineProps<{
		groupOrItem: ProjectGroupItem
		indent?: number
	}>(),
	{
		indent: 0,
	}
)
</script>
