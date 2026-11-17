<template>
	<code style="white-space: pre">{{ debugStr }}</code>
</template>

<script setup lang="ts">
import * as util from "util"
import { computed, ref, watch } from "vue"

const props = defineProps<{
	model: any
}>()

const debugStr = ref<string>("")
watch(
	() => props.model,
	(value) => {
		debugStr.value = util.inspect(value, false, 15)
	},
	{ immediate: true, deep: true }
)
</script>
