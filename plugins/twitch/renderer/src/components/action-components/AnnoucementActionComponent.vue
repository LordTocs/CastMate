<template>
	<div class="fill flex flex-row">
		<div
			class="color-stripe"
			:style="{
				background: `linear-gradient(${annouceGradientStart}, ${annouceGradientEnd})`,
			}"
		></div>
		<chat-message-display :message="model.message" class="flex-grow-1" />
		<div
			class="color-stripe"
			:style="{
				background: `linear-gradient(${annouceGradientStart}, ${annouceGradientEnd})`,
			}"
		></div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useChannelAccountResource } from "../../main"
import ChatMessageDisplay from "./ChatMessageDisplay.vue"

type AnnoucementColor = "primary" | "blue" | "green" | "orange" | "purple"

const model = defineModel<{ message: string; color: AnnoucementColor }>({ required: true })

const channelAccount = useChannelAccountResource()

const annouceGradientStart = computed(() => {
	switch (model.value.color) {
		case "blue":
			return "#00d6d6"
		case "green":
			return "#00db84"
		case "orange":
			return "#ffb31a"
		case "purple":
			return "#9146ff"
	}
	return "#000000"
})

const annouceGradientEnd = computed(() => {
	switch (model.value.color) {
		case "blue":
			return "#9146ff"
		case "green":
			return "#57bee6"
		case "orange":
			return "#e0e000"
		case "purple":
			return "#ff75e6"
	}
	return "#000000"
})
</script>

<style scoped>
.fill {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	top: 0;
}

.annouce-text {
	font-size: 0.7rem;
	padding: 0 0.25rem;
}

.color-stripe {
	width: 0.5rem;
	flex-shrink: 0;
	height: 100%;
}
</style>
