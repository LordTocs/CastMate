<template>
	<p class="select-dummy" ref="dummy">...</p>
</template>

<script setup lang="ts">
import { ref } from "vue"

// This monument to HTML mediocrity forces the DOM to select invisible text.
// The oncopy event will only fire if there's a selection to copy, so if we want to copy
// some non-text data structures like in the SequenceEditor we need to secretly select
// some text in the dom so the oncopy event fires when Ctrl+C is pressed.

const dummy = ref<HTMLElement>()
function select() {
	if (!dummy.value) return
	const range = document.createRange()
	range.selectNodeContents(dummy.value)
	const selection = window.getSelection()
	selection?.removeAllRanges()
	selection?.addRange(range)
}
defineExpose({
	select,
})
</script>

<style scoped>
.select-dummy {
	font-size: 0 !important;
	padding: 0 !important;
	margin: 0 !important;
	user-select: text;
}
</style>
