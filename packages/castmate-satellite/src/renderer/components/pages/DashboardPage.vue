<template>
	<dashboard-display />
</template>

<script setup lang="ts">
import { usePrimarySatelliteConnection } from "castmate-ui-core"
import { onBeforeUnmount } from "vue"

import DashboardDisplay from "../dashboard/DashboardDisplay.vue"
</script>
