<template>
	<template v-for="tab in allTabs" :id="tab.id">
		<Teleport v-if="tab.teleportPermutation" :to="`#tabdock-${tab.teleportPermutation}`">
			<div class="tab">
				<document-editor class="tab-fill" v-if="tab.documentId" :document-id="tab.documentId" />
				<component class="tab-fill" v-else-if="tab.page" :is="tab.page" :page-data="tab.pageData"> </component>
			</div>
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { DockedSplit, DockedTab, useDockingArea } from "../../main"
import DocumentEditor from "../document/DocumentEditor.vue"

//This component uses Vue Teleport to move the page components through the docking
//Without remounting them. This preserves ref<> values inside it's component tree
//That way we don't need to use a View data to preserve values

const dockingArea = useDockingArea()

function getAllTabs(split: DockedSplit): DockedTab[] {
	const result = new Array<DockedTab>()

	for (const subSplit of split.divisions) {
		if (subSplit.type == "frame") {
			result.push(...subSplit.tabs)
		} else {
			result.push(...getAllTabs(subSplit))
		}
	}

	return result
}

const allTabs = computed(() => getAllTabs(dockingArea))
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
