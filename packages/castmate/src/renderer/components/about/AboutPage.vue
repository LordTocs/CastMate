<template>
	<scrolling-tab-body>
		<h1>About CastMate</h1>
		<h3>v{{ version }}</h3>

		<p>
			<a href="https://www.castmate.io/" target="_blank"> CastMate Home Page </a>
			<br />
			<a href="https://www.github.com/LordTocs/CastMate" target="_blank"> GitHub </a>
			<br />
			<a href="https://discord.gg/txt4DUzYJM" target="_blank"> Help Discord </a>
			<br />
			<a href="https://github.com/LordTocs/CastMate/blob/main/LICENSE.md" target="_blank"> License </a>
		</p>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { ScrollingTabBody, useIpcCaller, useIpcMessage } from "castmate-ui-core"
import { onMounted, ref } from "vue"

const version = ref("")

const getVersion = useIpcCaller<() => string>("windowFuncs", "getVersion")

onMounted(async () => {
	version.value = await getVersion()
})
</script>
