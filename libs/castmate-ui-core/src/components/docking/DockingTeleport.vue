<template>
	<Teleport v-if="tab.teleportPermutation" :to="`#tabdock-${tab.teleportPermutation}`">
		<div class="tab">
			<component class="tab-fill" v-if="tab.page" :is="tab.page" :page-data="tab.pageData"> </component>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { provide, useModel } from "vue"
import { DockedTab, DockedFrame } from "../../main"

const props = defineProps<{
	tab: DockedTab
	frame: DockedFrame
}>()

const frameModel = useModel(props, "frame")

provide("docking-frame", frameModel)
</script>

<style scoped>
.tab {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	right: 0;

	display: flex;
	background-color: var(--surface-a);
	flex: 1;
}

.tab-fill {
	flex: 1;
}
</style>
