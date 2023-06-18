<template>
	<div class="scroller-outer">
		<div :class="['scroller-inner', innerClass]">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		innerClass?: string
	}>(),
	{}
)
/*
export default {
	props: {
		color: { type: String, default: "transparent" },
		innerClass: {},
	},
}*/
</script>

<style scoped>
.scroller-outer {
	position: relative;
}
.scroller-inner {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	overflow: auto;
}
</style>
