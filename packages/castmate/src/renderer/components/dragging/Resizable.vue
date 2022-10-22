<template>
    <div :style="frameStyle" @click.stop="" :class="{ selected, unselected: !selected }" ref="frame">
        <div :style="scaleStyle" @mousedown="onWidgetMouseDown">
            <slot></slot>
        </div>

        <template v-if="selected">
            <div v-for="handle in dragHandles" :key="handle.id" :class="['handle', handle.class]" @mousedown="onHandleMouseDown($event, handle)" @click.stop=""></div>
        </template>
    </div>
</template>

<script setup>
import _cloneDeep from 'lodash/cloneDeep'
import { ref, computed, inject } from 'vue';
import { useEventListener } from '../../utils/events.js';

const dragHandles = [
    { id: 'tl',  class: 'handle-tl', hx: 0, hy: 0 },
    { id: 't', class: 'handle-t', hx: 0.5, hy: 0 },
    { id: 'tr', class: 'handle-tr', hx: 1, hy: 0 },
    { id: 'l', class: 'handle-l', hx: 0, hy: 0.5 },
    { id: 'r', class: 'handle-r', hx: 1, hy: 0.5 },
    { id: 'bl', class: 'handle-bl', hx: 0, hy: 1 },
    { id: 'b', class: 'handle-b', hx: 0.5, hy: 1 },
    { id: 'br', class: 'handle-br', hx: 1, hy: 1 },
]

const props = defineProps({
    minWidth: { type: Number },
    minHeight: { type: Number },
    maxWidth: { type: Number },
    maxHeight: { type: Number },

    transform: { },
    
    x: { type: Number },
    y: { type: Number },
    width: { type: Number },
    height: { type: Number },
    
    selected: { type: Boolean, default: () => false },
})

const emit = defineEmits(['update:transform', 'update:selected'])

const defineModel = (varName) => {
    return computed({
        get() {
            return props[varName];
        },
        set(value) {
            emit(`update:${varName}`, value)
        }
    })
}

const transform = defineModel('transform')
const selected = defineModel('selected')
const renderScale = inject('renderScale');

const frameStyle = computed(() => ({
    position: 'absolute',
    left: `${transform.value.position.x * renderScale.value }px`,
    top: `${transform.value.position.y * renderScale.value }px`,
    width: `${transform.value.size.width * renderScale.value }px`,
    height: `${transform.value.size.height * renderScale.value }px`,
}))

const scaleStyle = computed(() => ({ zoom: renderScale.value, position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }))

const grabbedHandle = ref(null);

const frame = ref(null);
const dragFrame = inject('dragFrame');

const dragOffset = {}

const onHandleMouseDown = (event, handle) => {
    let containerRect = dragFrame.value.getBoundingClientRect();
      
    const mx = (event.clientX - containerRect.left) / renderScale.value;
    const my = (event.clientY - containerRect.top) / renderScale.value;

    const elemRect = frame.value.getBoundingClientRect();
    const hx = (elemRect.left - containerRect.left + elemRect.width * handle.hx) / renderScale.value;
    const hy = (elemRect.top - containerRect.top + elemRect.height * handle.hy) / renderScale.value;

    dragOffset.offsetX = hx - mx
    dragOffset.offsetY = hy - my

    grabbedHandle.value = handle.id;
    console.log('Grabbed', grabbedHandle.value, dragOffset.offsetX, dragOffset.offsetY);
    
    event.preventDefault();
}

const onWidgetMouseDown = (event) => {
    selected.value = true;

    let containerRect = dragFrame.value.getBoundingClientRect();
      
    const mx = (event.clientX - containerRect.left) / renderScale.value;
    const my = (event.clientY - containerRect.top) / renderScale.value;

    dragOffset.offsetX = transform.value.position.x - mx;
    dragOffset.offsetY = transform.value.position.y - my;

    grabbedHandle.value = 'middle'

    event.preventDefault();
}

function stopNextClick() {
    window.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
    }, { once: true, capture: true });
}


useEventListener(window, 'mouseup', (ev) => {
    if (!grabbedHandle.value)
        return;

    grabbedHandle.value = null;

    ev.preventDefault();
    ev.stopPropagation();

    const elemRect = frame.value.getBoundingClientRect();
    console.log(elemRect)
    console.log(ev.clientX, ev.clientY);

    stopNextClick();
})


useEventListener(window, 'mousemove', (ev) => {
    if (!grabbedHandle.value)
        return;

    ev.preventDefault();
    
    
    //Do magic here.
    let containerRect = dragFrame.value.getBoundingClientRect();
    const mx = (ev.clientX - containerRect.left) / renderScale.value;
    const my = (ev.clientY - containerRect.top) / renderScale.value;

    const targetX = mx + dragOffset.offsetX;
    const targetY = my + dragOffset.offsetY;

    const newTransform = _cloneDeep(transform.value)

    const handle = dragHandles.find(h => h.id == grabbedHandle.value);
    if (handle)
    {
        if (handle.id.includes('l'))
        {
            //Moving left handle
            const rightX = newTransform.position.x + newTransform.size.width; 
            newTransform.position.x = targetX
            newTransform.size.width = rightX - targetX
        }
        else if (handle.id.includes('r'))
        {
            //Moving right handle
            const leftX = newTransform.position.x;
            newTransform.size.width = targetX - leftX
        }

        if (handle.id.includes('t'))
        {
            //Moving the top handle
            const bottomY = newTransform.position.y + newTransform.size.height;
            newTransform.position.y = targetY
            newTransform.size.height = bottomY - targetY
        }
        else if (handle.id.includes('b'))
        {
            const topY = newTransform.position.y;
            newTransform.size.height = targetY - topY;
        }
    }
    else if (grabbedHandle.value == 'middle')
    {
        newTransform.position.x = targetX
        newTransform.position.y = targetY
    }

    transform.value = newTransform
})

</script>


<style scoped>
.selected {
    border: dashed 1px red;
    cursor: move;
}

.unselected {
    border: dashed 1px transparent;
}

.handle {
    --handleSize: 3px;
    width: calc(var(--handleSize)*2);
    height: calc(var(--handleSize)*2);
    background-color: red;
    position: absolute;
}

.handle-tl {
    cursor: nw-resize;
    top: calc(var(--handleSize)*-1);
    left: calc(var(--handleSize)*-1);
}
.handle-t {
    cursor: n-resize;
    top: calc(var(--handleSize)*-1);
    left: calc(50% - var(--handleSize))
}
.handle-tr {
    cursor: ne-resize;
    top: calc(var(--handleSize)*-1);
    right: calc(var(--handleSize)*-1);
}
.handle-l {
    cursor: w-resize;
    top: calc(50% - var(--handleSize));
    left: calc(var(--handleSize)*-1);
}
.handle-r {
    cursor: e-resize;
    top: calc(50% - var(--handleSize));
    right: calc(var(--handleSize)*-1);
}
.handle-bl {
    cursor: sw-resize;
    bottom: calc(var(--handleSize)*-1);
    left: calc(var(--handleSize)*-1);
}
.handle-b {
    cursor: s-resize;
    bottom: calc(var(--handleSize)*-1);
    left: calc(50% - var(--handleSize))
}
.handle-br {
    cursor: se-resize;
    bottom: calc(var(--handleSize)*-1);
    right: calc(var(--handleSize)*-1);
}
</style>