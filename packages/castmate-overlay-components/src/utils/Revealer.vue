<template>
    <transition :name="uniqueid">
        <slot></slot>
    </transition>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useDynamicSheet, styleId } from './stylesheets';



const props = defineProps({
    transition: { type: [Number, String, Object] },
    animation: { }
})

const uniqueid = ref(styleId());

const sheet = useDynamicSheet();

watchEffect(() => {

    //Expand props.animation / props.transition
    sheet.sheetRules.value[`.${uniqueid.value}-enter-from`] = {
        ...(props.animation?.enterFrom ? props.animation?.enterFrom : props.animation?.inactive ),
    }

    sheet.sheetRules.value[`.${uniqueid.value}-enter-to`] = {
        ...(props.animation?.enterTo ? props.animation?.enterTo : props.animation?.active ),
    }

    sheet.sheetRules.value[`.${uniqueid.value}-enter-active`] = {
        ...props.animation?.enterActive,
        transitionDuration: `${props.transition}s`,
        transitionProperty: 'all',
        transitionTimingFunction: 'linear',
    }
    sheet.sheetRules.value[`.${uniqueid.value}-leave-from`] = {
        ...(props.animation?.leaveFrom ? props.animation?.leaveFrom : props.animation?.active ),
    }

    sheet.sheetRules.value[`.${uniqueid.value}-leave-to`] = {
        ...(props.animation?.leaveTo ? props.animation?.leaveTo : props.animation?.inactive ),
    }

    sheet.sheetRules.value[`.${uniqueid.value}-leave-active`] = {
        ...props.animation?.enterActive,
        transitionDuration: `${props.transition}s`,
        transitionProperty: 'all',
        transitionTimingFunction: 'linear',
    }
})
</script>

<style scoped>
</style>