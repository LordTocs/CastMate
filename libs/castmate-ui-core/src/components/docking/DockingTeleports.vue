<template>
	<template v-for="(tabFrame, i) in allTabs" :id="tabFrame.tab.id">
		<docking-teleport :tab="tabFrame.tab" v-model:frame="allTabs[i].frame" />
	</template>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { DockedFrame, DockedSplit, DockedTab, useDockingArea } from "../../main"
import DockingTeleport from "./DockingTeleport.vue"

//This component uses Vue Teleport to move the page components through the docking
//Without remounting them. This preserves ref<> values inside it's component tree
//That way we don't need to use a View data to preserve values

const dockingArea = useDockingArea()

function getAllTabs(split: DockedSplit): { tab: DockedTab; frame: DockedFrame }[] {
	const result = new Array<{ tab: DockedTab; frame: DockedFrame }>()

	for (const subSplit of split.divisions) {
		if (subSplit.type == "frame") {
			result.push(...subSplit.tabs.map((t) => ({ tab: t, frame: subSplit })))
		} else {
			result.push(...getAllTabs(subSplit))
		}
	}

	return result
}

const allTabs = computed(() => getAllTabs(dockingArea.value))
</script>
