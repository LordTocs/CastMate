<template>
    <div :style="frameStyle" :class="{ unselected: true }" ref="frame">
        <div :style="scaleStyle" @mousedown="onWidgetMouseDown">
            <slot></slot>
        </div>
    </div>
    <div :style="frameStyle" @click.stop="" :class="{ selected, 'drag-div': true }" v-if="selected" >
        <div class="drag-cover" @mousedown="onWidgetMouseDown"></div>
        <template v-if="selected">
            <div v-for="handle in dragHandles" :key="handle.id" :class="['handle', handle.class]" @mousedown="onHandleMouseDown($event, handle)" @click.stop=""></div>
        </template>
    </div>
</template>

<script setup>
import _cloneDeep from 'lodash/cloneDeep'
import { ref, computed, inject } from 'vue';
import { useWindowEventListener } from '../../utils/events.js';

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
    aspectRatio: { type: Number },

    transform: { },
    
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
    if (event.button != 0)
        return
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
    if (event.button != 0)
        return
    
    selected.value = true;

    let containerRect = dragFrame.value.getBoundingClientRect();
      
    const mx = (event.clientX - containerRect.left) / renderScale.value;
    const my = (event.clientY - containerRect.top) / renderScale.value;

    dragOffset.offsetX = transform.value.position.x - mx;
    dragOffset.offsetY = transform.value.position.y - my;

    grabbedHandle.value = 'middle'
}

function stopNextClick() {
    window.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
    }, { once: true, capture: true });
}


useWindowEventListener('mouseup', (ev) => {
    if (!grabbedHandle.value)
        return;

    if (ev.button != 0)
        return

    grabbedHandle.value = null;

    ev.preventDefault();
    ev.stopPropagation();
    
    stopNextClick();
})

function extractEdges(transform) {
    return {
        left: transform.position.x,
        right: transform.position.x + transform.size.width,
        top: transform.position.y,
        bottom: transform.position.y + transform.size.height,
    }
}

function setEdges(transform, edges) {
    transform.position.x = edges.left;
    transform.size.width = edges.right - edges.left;
    transform.position.y = edges.top;
    transform.size.height = edges.bottom - edges.top;
}

function enforceAspectRatio(edges, aspectRatio, handle) {

    let width = edges.right - edges.left;
    let height = edges.bottom - edges.top;

    const newWidth = height * aspectRatio;
    const newHeight = width / aspectRatio;

    if (handle.id.length > 1)
    {
        //Choose whichever new rectangle's area is the least.
        const wA = width * newHeight;
        const hA = height * newWidth;
        if (wA < hA)
        {
            width = newWidth;
        }
        else
        {
            height = newHeight;
        }
    }
    else
    {
        //We're grabbing a side.
        if (handle.id == 'l' || handle.id == 'r')
        {
            height = newHeight;
        }
        else
        {
            width = newWidth;
        }
    }
    
    if (handle.id.includes('l'))
    {
        //Move the left side instead of the right
        edges.left = edges.right - width;
    }
    else
    {
        edges.right = edges.left + width;
    }

    if (handle.id.includes('t'))
    {
        //Move the top instead of the bottom
        edges.top = edges.bottom - height;
    }
    else
    {
        edges.bottom = edges.top + height;
    }
}

function snapEdgesToInt(edges) {
    edges.left = Math.round(edges.left)
    edges.right = Math.round(edges.right)
    edges.top = Math.round(edges.top)
    edges.bottom = Math.round(edges.bottom)
}


useWindowEventListener('mousemove', (ev) => {
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
        const edges = extractEdges(transform.value);
        if (handle.id.includes('l'))
        {
            //Moving left handle
            edges.left = targetX;
        }
        else if (handle.id.includes('r'))
        {
            //Moving right handle
            edges.right = targetX;
        }

        if (handle.id.includes('t'))
        {
            //Moving the top handle
            edges.top = targetY;
        }
        else if (handle.id.includes('b'))
        {
            edges.bottom = targetY;
        }
        if (props.aspectRatio)
        {
            enforceAspectRatio(edges, props.aspectRatio, handle);
        }
        snapEdgesToInt(edges)
        setEdges(newTransform, edges);
    }
    else if (grabbedHandle.value == 'middle')
    {
        newTransform.position.x = Math.round(targetX)
        newTransform.position.y = Math.round(targetY)
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

.drag-div {
    z-index: 1000;
}

.drag-cover {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
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