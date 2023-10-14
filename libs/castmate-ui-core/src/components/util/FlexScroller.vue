<template>
	<div class="scroller-outer">
		<div :class="['scroller-inner', innerClass]" @scroll="onScroll" ref="scroller">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"

const props = withDefaults(
	defineProps<{
		innerClass?: string
		scrollY?: number
		scrollX?: number
	}>(),
	{}
)

const emit = defineEmits(["update:scrollX", "update:scrollY"])

const scroller = ref<HTMLElement | null>(null)
function onScroll(ev: Event) {
	if (!scroller.value) return

	if (props.scrollY != null && props.scrollY != scroller.value.scrollTop) {
		emit("update:scrollY", scroller.value.scrollTop)
	}
	if (props.scrollX != null && props.scrollX != scroller.value.scrollLeft) {
		emit("update:scrollX", scroller.value.scrollLeft)
	}
}

watch(
	() => props.scrollY,
	() => {
		if (!scroller.value || props.scrollY == null) return

		scroller.value.scrollTop = props.scrollY
	},
	{ immediate: true }
)

watch(
	() => props.scrollX,
	() => {
		if (!scroller.value || props.scrollX == null) return

		scroller.value.scrollLeft = props.scrollX
	},
	{ immediate: true }
)

onMounted(() => {
	if (!scroller.value || props.scrollY == null || props.scrollX == null) return

	scroller.value.scrollTop = props.scrollY
	scroller.value.scrollLeft = props.scrollX
})

defineExpose({
	scroller: computed(() => scroller.value),
})
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

.scroll-x {
	overflow-x: auto;
}

.scroll-y {
	overflow-y: auto;
}
</style>
