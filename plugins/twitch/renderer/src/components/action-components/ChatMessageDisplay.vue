<template>
	<div class="chat-message flex flex-column justify-content-center px-1 text-center">
		{{ message }}
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	message: string | undefined
}>()
</script>

<style scoped>
.chat-message {
	font-size: 0.8rem;
	background-color: #181818c0;
}
</style>
