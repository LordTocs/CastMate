<template>
	<widget-loader v-for="widget in bridge.config.widgets" :widgetConfig="widget" />
</template>

<script setup lang="ts">
import WidgetLoader from "./WidgetLoader.vue"
import { computed, onMounted } from "vue"
import { useWebsocketBridge } from "./utils/websocket"
import { loadOverlayWidgets } from "castmate-overlay-widget-loader"

const bridge = useWebsocketBridge()

onMounted(() => {
	loadOverlayWidgets()

	bridge.initialize()
})
</script>

<style>
body {
	margin: 0;
}
</style>
