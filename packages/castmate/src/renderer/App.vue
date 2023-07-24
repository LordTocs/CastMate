<template>
	<div class="app">
		<system-bar title="Hello World"></system-bar>
		<div class="app-row">
			<project-view />
			<docking-area style="flex: 1" v-model="dockedInfo" />
		</div>
	</div>
</template>

<script setup lang="ts">
import SystemBar from "./components/system/SystemBar.vue"
import { useDocumentStore, DockingArea, type DockedArea } from "castmate-ui-core"
import ProjectView from "./components/layout/ProjectView.vue"
import { onMounted, ref } from "vue"
import { nanoid } from "nanoid/non-secure"

const documentStore = useDocumentStore()

onMounted(() => {
	const docs = [
		documentStore.addDocument(
			{
				name: "Test 1",
				triggers: [
					{
						id: "abc",
						plugin: "castmate",
						trigger: "test",
						queue: "main",
						config: {},
						sequence: {
							actions: [],
						},
						floatingSequences: [],
					},
					{
						id: "bcd",
						plugin: "castmate",
						trigger: "test",
						queue: "main",
						config: {},
						sequence: {
							actions: [],
						},
						floatingSequences: [],
					},
					{
						id: "cde",
						plugin: "castmate",
						trigger: "test",
						queue: "main",
						config: {},
						sequence: {
							actions: [],
						},
						floatingSequences: [],
					},
					{
						id: "def",
						plugin: "castmate",
						trigger: "test",
						queue: "main",
						config: {},
						sequence: {
							actions: [],
						},
						floatingSequences: [],
					},
					{
						id: "efg",
						plugin: "castmate",
						trigger: "test",
						queue: "main",
						config: {},
						sequence: {
							actions: [],
						},
						floatingSequences: [],
					},
				],
			},
			"profile"
		),
		documentStore.addDocument(
			{
				name: "Test 2",
				triggers: [],
			},
			"profile"
		),
		documentStore.addDocument(
			{
				name: "Test 3",
			},
			"test"
		),
		documentStore.addDocument(
			{
				name: "Test 4",
			},
			"test"
		),
	]

	dockedInfo.value.divisions.push({
		id: nanoid(),
		type: "frame",
		currentTab: docs[0].id,
		tabs: [
			{
				id: nanoid(),
				documentId: docs[0].id,
			},
			{
				id: nanoid(),
				documentId: docs[1].id,
			},
		],
	})
	/*dockedInfo.value.divisions.push({
		id: nanoid(),
		type: "frame",
		currentTab: docs[2].id,
		tabs: [
			{
				id: nanoid(),
				documentId: docs[2].id,
			},
			{
				id: nanoid(),
				documentId: docs[3].id,
			},
		],
	})
	dockedInfo.value.dividers.push(0.5)*/
})

const dockedInfo = ref<DockedArea>({
	id: "abc",
	type: "split",
	direction: "horizontal",
	dividers: [],
	divisions: [],
	dragging: false,
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

.app-row {
	flex: 1;
	display: flex;
	flex-direction: row;
}
</style>
