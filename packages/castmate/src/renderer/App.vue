<template>
	<div class="app">
		<system-bar title="Hello World"></system-bar>
		<docking-area style="flex: 1" v-model="dockedInfo" />
	</div>
</template>

<script setup lang="ts">
import SystemBar from "./components/system/SystemBar.vue"
import { DockingArea, type DockedSplit } from "castmate-ui-core"
import TestEditor from "./components/test/TestEditor.vue"
import { ref } from "vue"

const dockedInfo = ref<DockedSplit>({
	id: "abc",
	type: "split",
	direction: "horizontal",
	divisions: [
		{
			id: "bcd",
			type: "frame",
			currentTab: "cde",
			tabs: [
				{
					id: "cde",
					document: { value: "hello" },
					component: TestEditor,
				},
			],
		},
	],
})
</script>

<style>
body {
	background: #0f0f0f;
	color: white;
	margin: 0;
	font-family: var(--font-family);
}
</style>

<style scoped>
.app {
	width: 100vw;
	height: 100vh;
	position: relative;
	display: flex;
	flex-direction: column;
}
</style>
