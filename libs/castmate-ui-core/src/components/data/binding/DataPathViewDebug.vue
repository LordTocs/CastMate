<template>
	<div class="path-view py-1">
		<div class="flex flex-row gap-1 align-items-center">
			<pre>{{ path }}</pre>
			<p-button class="extra-small-button" size="small" @click="focus"> focus</p-button>
			<p-button class="extra-small-button" size="small" @click="scrollIntoView"> scroll</p-button>
		</div>
		<div class="flex flex-row gap-1 align-items-center">
			<div v-for="binding in pathBinding.uiBindings" class="">
				{{ binding.focus ? "f" : "" }}{{ binding.scrollIntoView ? "s" : ""
				}}{{ binding.onChildFocus ? "cf" : "" }}{{ binding.onChildScrollIntoView ? "cs" : "" }}
			</div>
		</div>
		<div v-if="hasViewData">
			<pre>{{ util.inspect(viewData?.data) }}</pre>
		</div>

		<div class="children">
			<div v-for="subPath in subPathKeys">
				<data-path-view-debug
					:root="root"
					:path="subPath"
					:parent-path="fullPath"
					:path-binding="pathBinding.subPaths[subPath]"
					:view-data="viewData?.subPaths[subPath]"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { DataPathBinding, focusDataByPath, RootDataBinding, scrollIntoViewDataByPath } from "../../../main"
import util from "util"
import PButton from "primevue/button"
import { joinDataPath, ViewData } from "castmate-schema"

const props = defineProps<{
	parentPath: string
	path: string
	pathBinding: DataPathBinding
	root: RootDataBinding
	viewData?: ViewData
}>()

const fullPath = computed(() => joinDataPath(props.parentPath, props.path))

const subPathKeys = computed(() => Object.keys(props.pathBinding?.subPaths ?? {}))

const hasViewData = computed(() => Object.keys(props.viewData?.data ?? {}).length > 0)

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
