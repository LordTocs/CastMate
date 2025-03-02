<template>
	<base-obs-action-component :obs="model.obs">
		<i class="mdi mdi-skip-backward" />
	</base-obs-action-component>
</template>

<script setup lang="ts">
import BaseObsActionComponent from "./BaseObsActionComponent.vue"

const model = defineModel<{ obs: string }>({ required: true })
</script>
