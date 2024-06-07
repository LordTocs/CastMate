<template>
	<flex-scroller
		ref="scroller"
		:inner-class="innerClass"
		:inner-style="innerStyle"
		:scroll-x="scrollX"
		:scroll-y="scrollY"
	>
		<slot></slot>
	</flex-scroller>
</template>

<script setup lang="ts">
import { StyleValue, ref, useModel } from "vue"
import FlexScroller from "../util/FlexScroller.vue"
import { provideScrollAttachable } from "../../main"

const props = withDefaults(
	defineProps<{
		innerClass?: string
		innerStyle?: StyleValue
		scrollY?: number
		scrollX?: number
	}>(),
	{}
)

const scrollX = useModel(props, "scrollX")
const scrollY = useModel(props, "scrollY")

const scroller = ref<InstanceType<typeof FlexScroller>>()

provideScrollAttachable(() => scroller.value?.scroller ?? undefined)
</script>
