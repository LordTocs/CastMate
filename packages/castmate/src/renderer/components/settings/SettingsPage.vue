<template>
	<flex-scroller ref="scroller">
		<account-widget account-type="TwitchAccount" account-id="channel" />
	</flex-scroller>
</template>

<script setup lang="ts">
import { FlexScroller, AccountWidget } from "castmate-ui-core"
</script>
