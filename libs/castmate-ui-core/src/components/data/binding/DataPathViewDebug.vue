<template>
	<div class="path-view py-1">
		<div class="flex flex-row gap-1 align-items-center">
			<pre>{{ path }}</pre>
			<p-button class="extra-small-button" size="small" @click="focus"> focus</p-button>
			<p-button class="extra-small-button" size="small" @click="scrollIntoView"> scroll</p-button>
		</div>
		<div class="flex flex-row gap-1 align-items-center">
			<div v-for="binding in pathView.uiBindings" class="">
				{{ binding.focus ? "f" : "" }}{{ binding.scrollIntoView ? "s" : ""
				}}{{ binding.onChildFocus ? "cf" : "" }}{{ binding.onChildScrollIntoView ? "cs" : "" }}
			</div>
		</div>
		<div v-if="hasViewData">
			<pre>{{ util.inspect(pathView.data) }}</pre>
		</div>

		<div class="children">
			<div v-for="subPath in subPathKeys">
				<data-path-view-debug
					:root="root"
					:path="subPath"
					:parent-path="fullPath"
					:path-view="pathView.subPaths[subPath]"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { DataPathView, focusDataByPath, joinDataPath, scrollIntoViewDataByPath } from "../../../main"
import util from "util"
import PButton from "primevue/button"

const props = defineProps<{
	parentPath: string
	path: string
	pathView: DataPathView
	root: DataPathView
}>()

const fullPath = computed(() => joinDataPath(props.parentPath, props.path))

const subPathKeys = computed(() => Object.keys(props.pathView?.subPaths ?? {}))

const hasViewData = computed(() => Object.keys(props.pathView?.data ?? {}).length > 0)

function focus() {
	focusDataByPath(props.root, fullPath.value)
}

function scrollIntoView() {
	scrollIntoViewDataByPath(props.root, fullPath.value)
}
</script>

<style scoped>
.path-view {
	border: solid 1px #aaaaaa;
	padding-left: 1rem;
}
.children {
	margin-left: 1rem;
}
</style>
