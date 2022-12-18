<template>
    <transition
        @before-enter="beforeEnter"
        @enter="enter"
        @after-enter="afterEnter"
        @enter-cancelled="enterCancelled"
        @before-leave="beforeLeave"
        @leave="leave"
        @after-leave="afterLeave"
        @leave-cancelled="leaveCancelled"
        :duration="500"
        :css="false"
    >
        <slot></slot>
    </transition>
</template>

<script setup>
import { computed } from 'vue';
import { isNumber, isString } from './typeHelpers.js';

const props = defineProps({
    transition: { type: [Number, String, Object] },
    animation: { }
})

const transitionTime = computed(() => {
    if (!props.transition || !props.animation)
        return 0;
    if (isNumber(props.transition))
        return props.transition
    return props.transition.duration
})

function applyTransition(cssStyle, transition) {
    if (isNumber(transition)) {
        cssStyle.transitionDuration = `${transition}s`
        cssStyle.transitionProperty = 'all'
        cssStyle.transitionTimingFunction = 'linear' 
    }
    else {
        cssStyle.transitionDuration = `${transition.duration}s`
        cssStyle.transitionProperty = 'all'
        if (transition.timing) {
            cssStyle.transitionTimingFunction = transition.timing
        }
        if (transition.timing) {
            cssStyle.transitionDelay = `${transition.delay}s`
        }
    }
} 

function dumpStyle(stage, cssStyle)
{
    //console.log("Animation Stage: ", stage, cssStyle.cssText)
}

function applyStyle(cssStyle, styleObj) {
    if (!cssStyle)
        return;
    if (isString(styleObj)) {
        cssStyle.cssText = cssStyle
    }
    else {
        if (styleObj)
        {
            Object.assign(cssStyle, styleObj)
        }
    }
}

function clearStyle(cssStyle) {
    for (let i = cssStyle.length; i--;) {
        const nameString = cssStyle[i];
        cssStyle.removeProperty(nameString);
    }
}

function beforeEnter(el) {
    clearStyle(el.style)
    applyStyle(el.style, props.animation.enterFrom || props.animation.inactive)
    dumpStyle("beforeEnter", el.style)
}

let enterTimeout = null;

function enter(el, done) {
    //Make sure to wait a frame to change the style so it gets painted at least onces with the beforeEnter style
    window.requestAnimationFrame(() => {
        clearStyle(el.style)
        applyTransition(el.style, props.transition)
        applyStyle(el.style, props.animation.enterActive)
        applyStyle(el.style, props.animation.enterTo || props.animation.active)
        dumpStyle("enter", el.style)
    })
    enterTimeout = setTimeout(done, transitionTime.value * 1000);
}

function afterEnter(el) {
    clearStyle(el.style)
    applyStyle(el.style, props.animation.enterTo || props.animation.active)
    dumpStyle("afterEnter", el.style)
    enterTimeout = null;
}

function enterCancelled(el) {
    clearStyle(el.style)
    if (enterTimeout)
    {
        clearTimeout(enterTimeout)
        enterTimeout = null
    }
}

///

let leaveTimeout = null;

function beforeLeave(el) {
    clearStyle(el.style)
    applyStyle(el.style, props.animation.leaveFrom || props.animation.active)
    dumpStyle("beforeLeave", el.style)
}

function leave(el, done) {
    window.requestAnimationFrame(() => {
        clearStyle(el.style)
        applyTransition(el.style, props.transition)
        applyStyle(el.style, props.animation.leaveActive)
        applyStyle(el.style, props.animation.leaveTo || props.animation.inactive)
        dumpStyle("leave", el.style)
    })
    leaveTimeout = setTimeout(done, transitionTime.value * 1000);
}

function afterLeave(el) {
    clearStyle(el.style)
    applyStyle(el.style, props.animation.leaveTo || props.animation.inactive)
    dumpStyle("afterLeave", el.style)
    leaveTimeout = null
}

function leaveCancelled(el) {
    clearStyle(el.style)
    if (leaveTimeout)
    {
        clearTimeout(leaveTimeout)
        leaveTimeout = null
    }
}



</script>

<style scoped>
</style>