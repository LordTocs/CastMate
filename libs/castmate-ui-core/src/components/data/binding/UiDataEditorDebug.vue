<template>
	<div class="flex flex-column">
		<div>
			<pre>{{
				util.inspect(editor.rootData, {
					depth: 10,
					compact: false,
				})
			}}</pre>
		</div>
	</div>
	<div>
		<pre v-for="stackItem in editor.editor.editStack.undoStack">{{
			util.inspect(stackItem, {
				depth: 50,
				compact: false,
			})
		}}</pre>
	</div>
	<data-path-view-debug
		path=""
		parent-path=""
		:path-view="editor.editor.view"
		:root="editor.dataBinding"
		:path-binding="editor.dataBinding.rootPath"
	/>
</template>

<script setup lang="ts">
import util from "util"
import { UIDataEditor } from "../../../main"
import DataPathViewDebug from "./DataPathViewDebug.vue"

const props = defineProps<{
	editor: UIDataEditor
}>()
</script>
