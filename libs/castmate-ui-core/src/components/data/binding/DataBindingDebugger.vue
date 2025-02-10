<template>
	<div class="flex flex-column">
		<div>
			<pre>{{
				util.inspect(binding.rootData, {
					depth: 10,
					compact: false,
				})
			}}</pre>
		</div>
	</div>
	<div>
		<pre v-for="stackItem in binding.undoStack.stack">{{
			util.inspect(stackItem, {
				depth: 50,
				compact: false,
			})
		}}</pre>
	</div>
	<data-path-view-debug path="" parent-path="" :path-view="binding.rootView" :root="binding.rootView" />
</template>

<script setup lang="ts">
import util from "util"
import { DataBinding } from "../../../main"
import DataPathViewDebug from "./DataPathViewDebug.vue"

const props = defineProps<{
	binding: DataBinding
}>()
</script>
