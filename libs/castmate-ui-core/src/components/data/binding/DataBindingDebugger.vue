<template>
	<data-path-view-debug path="" parent-path="" :path-view="binding.root" :root="binding.root" />
</template>

<script setup lang="ts">
import { DataBinding } from "../../../main"
import DataPathViewDebug from "./DataPathViewDebug.vue"

const props = defineProps<{
	binding: DataBinding
}>()
</script>
