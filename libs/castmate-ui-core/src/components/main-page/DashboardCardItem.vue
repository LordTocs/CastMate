<template>
    <div class="dash-item">
        <div class="dash-item-content">
            <slot></slot>
        </div>
        <div class="dash-item-name"> <span v-if="label">{{ label }}</span><span v-else>&nbsp;</span></div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    label?: string
}>()

</script>

<style scoped>
.dash-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-width: 100px;
}

.dash-item-content {
    flex-grow: 1;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.dash-item-name {
    white-space: nowrap;
}


.dash-item:not(:last-child) {
    border-right: solid 2px var(--surface-border);
}
</style>