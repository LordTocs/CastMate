<template>
	<chat-message-display :message="model.message" class="fill" />
</template>

<script setup lang="ts">
import ChatMessageDisplay from "./ChatMessageDisplay.vue"

const model = defineModel<{
	message: string | undefined
}>({ required: true })
</script>

<style scoped>
.fill {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	top: 0;
	overflow: hidden;
}
</style>
