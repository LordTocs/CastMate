<template>
	<transition :name="uniqueid">
		<slot></slot>
	</transition>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useDynamicSheet, styleIdGenerator, CSSSheetRules } from "../util/stylesheets"
import { RevealAnimation } from "../util/animation-util"

const props = defineProps<{
	transition: number
	animation: RevealAnimation
}>()

const uniqueid = ref(styleIdGenerator())

const cssRules = computed<CSSSheetRules>(() => {
	return {
		[`.${uniqueid.value}-enter-from`]: {
			...(props.animation?.enterFrom ? props.animation?.enterFrom : props.animation?.inactive),
		},
		[`.${uniqueid.value}-enter-to`]: {
			...(props.animation?.enterTo ? props.animation?.enterTo : props.animation?.active),
		},
		[`.${uniqueid.value}-enter-active`]: {
			...props.animation?.enterActive,
			transitionDuration: `${props.transition}s`,
			transitionProperty: "all",
			transitionTimingFunction: "linear",
		},
		[`.${uniqueid.value}-leave-from`]: {
			...(props.animation?.leaveFrom ? props.animation?.leaveFrom : props.animation?.active),
		},
		[`.${uniqueid.value}-leave-to`]: {
			...(props.animation?.leaveTo ? props.animation?.leaveTo : props.animation?.inactive),
		},
		[`.${uniqueid.value}-leave-active`]: {
			...props.animation?.leaveActive,
			transitionDuration: `${props.transition}s`,
			transitionProperty: "all",
			transitionTimingFunction: "linear",
		},
	}
})

const sheet = useDynamicSheet(cssRules)
</script>

<style scoped></style>
