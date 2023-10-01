<template>
	<div class="flex flex-row mt-3 justify-content-center">
		<div class="flex flex-column align-items-center">
			<h3 class="my-0">Channel Account</h3>
			<span class="my-0 text-300">Sign into your main channel account here.</span>
			<account-widget account-type="TwitchAccount" account-id="channel" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { AccountWidget } from "castmate-ui-core"

const props = defineProps<{}>()
</script>
