<template>
	<div class="flex flex-row mt-3 justify-content-center gap-4">
		<div class="flex flex-column align-items-center gap-1">
			<h3 class="my-0">Kasa Account</h3>
			<account-widget account-type="KasaAccount" account-id="main" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { AccountWidget } from "castmate-ui-core"

const props = defineProps<{}>()
</script>
