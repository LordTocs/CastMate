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
							actions: [
								{
									id: "acb",
									plugin: "castmate",
									action: "delay",
									config: {
										duration: 1.5,
									},
									offsets: [],
								},
								{
									id: "cad",
									plugin: "castmate",
									action: "blah",
									config: {},
								},
								{
									id: "qrs",
									plugin: "castmate",
									action: "tts",
									config: {
										duration: 3,
									},
									offsets: [
										{
											id: "fff",
											offset: 1.0,
											actions: [
												{
													id: "ytg",
													plugin: "castmate",
													action: "blah",
													config: {},
												},
											],
										},
									],
								},
								{
									id: "cde",
									stack: [
										{
											id: "def",
											plugin: "castmate",
											action: "blah",
											config: {},
										},
										{
											id: "efg",
											plugin: "castmate",
											action: "blah",
											config: {},
										},
									],
								},
							],
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
							actions: [
								{
									id: "acb",
									plugin: "castmate",
									action: "delay",
									config: {
										duration: 1.5,
									},
									offsets: [],
								},
								{
									id: "cad",
									plugin: "castmate",
									action: "blah",
									config: {},
								},
								{
									id: "qrs",
									plugin: "castmate",
									action: "tts",
									config: {
										duration: 3,
									},
									offsets: [
										{
											id: "fff",
											offset: 1.0,
											actions: [
												{
													id: "ytg",
													plugin: "castmate",
													action: "blah",
													config: {},
												},
											],
										},
									],
								},
								{
									id: "cde",
									stack: [
										{
											id: "def",
											plugin: "castmate",
											action: "blah",
											config: {},
										},
										{
											id: "efg",
											plugin: "castmate",
											action: "blah",
											config: {},
										},
									],
								},
							],
						},
						floatingSequences: [],
					},
				],
			},
			{
				scrollX: 0,
				scrollY: 0,
				triggers: [
					{
						id: "abc",
						open: false,
						sequenceView: {
							panState: {
								panX: 0,
								panY: 0,
								zoomX: 1,
								zoomY: 1,
								panning: false,
							},
							selection: [],
						},
					},
					{
						id: "bcd",
						open: false,
						sequenceView: {
							panState: {
								panX: 0,
								panY: 0,
								zoomX: 1,
								zoomY: 1,
								panning: false,
							},
							selection: [],
						},
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
			{
				scrollX: 0,
				scrollY: 0,
				triggers: [],
			},
			"profile"
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
