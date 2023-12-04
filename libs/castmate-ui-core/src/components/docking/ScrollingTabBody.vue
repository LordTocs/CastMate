<template>
	<flex-scroller ref="scroller" :scroll-x="scrollX" :scroll-y="scrollY">
		<slot></slot>
	</flex-scroller>
</template>

<script setup lang="ts">
import { ref, useModel } from "vue"
import FlexScroller from "../util/FlexScroller.vue"
import { provideScrollAttachable } from "../../main"

const props = withDefaults(
	defineProps<{
		innerClass?: string
		scrollY?: number
		scrollX?: number
	}>(),
	{}
)

const scrollX = useModel(props, "scrollX")
const scrollY = useModel(props, "scrollY")

const scroller = ref<InstanceType<typeof FlexScroller>>()

provideScrollAttachable(scroller.value?.scroller ?? undefined)
</script>
