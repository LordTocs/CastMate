<template>
	<base-obs-action-component :obs="model.obs">
		<span class="text-center">{{ model.scene }}</span>
	</base-obs-action-component>
</template>

<script setup lang="ts">
import BaseObsActionComponent from "./BaseObsActionComponent.vue"

const model = defineModel<{ obs: string; scene: string }>({ required: true })
</script>

<style scoped></style>
