<template>
    <div class="outer">
        <div class="inner">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.outer {
    overflow: hidden;
    height: 1em;
}

.outer::before {
    content: "";
    display: inline-block;
}

.inner {
    display: inline-block;
    white-space: nowrap;
}
</style>