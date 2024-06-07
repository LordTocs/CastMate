<template>
<dashboard-card-item :label="label">
    <p>{{ state?.value ?? '--'}}</p>
</dashboard-card-item>
</template>

<script setup lang="ts">
import { useState } from '../../main';
import DashboardCardItem from './DashboardCardItem.vue';

const props = defineProps<{
    plugin: string,
    state: string,
    label?: string
}>()

const state = useState(() => props)
</script>