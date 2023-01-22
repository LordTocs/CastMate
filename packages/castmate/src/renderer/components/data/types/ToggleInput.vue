<template>
<v-input v-model="modelObj" class="v-switch" :density="props.density">
    <div class="toggle-control">
        <v-label style="padding-inline-start: 0px; padding-inline-end: 10px;">
            {{ props.schema?.leftLabel }}
        </v-label>
        <div class="toggle-control-wrapper">
            <div class="v-switch__track">
                <div class="track-section" @click="modelObj=false"></div>
                <div class="track-section" @click="modelObj='toggle'"></div>
                <div class="track-section" @click="modelObj=true"></div>
            </div>
            <div 
                class="toggle-control-thumb-holder" 
                :class="{
                    'toggle-control-on': props.modelValue === true,
                    'toggle-control-off': !props.modelValue,
                    'toggle-control-switch': props.modelValue === 'toggle'}
                "
                @click="cycleInput"
                v-ripple
            >
                <div class="v-switch__thumb">
                    <v-icon v-if="thumbIcon" style="color: white" :icon="thumbIcon" size="x-small" />
                </div>
            </div>
        </div>
        <v-label>
            {{ props.label }}
        </v-label>
    </div>
</v-input>
</template>

<script setup>
import { computed } from 'vue';
import { useModel } from '../../../utils/modelValue';


const props = defineProps({
    modelValue: {},
    inset: {},
    schema: {},
    context: {},
    secret: { type: Boolean },
    colorRefs: {},
    label: { type: String },
    density: { type: String }
})

const emit = defineEmits(['update:modelValue'])

const modelObj = useModel(props, emit);

const thumbIcon = computed(() => {
    if (props.modelValue === 'toggle')
        return 'mdi-swap-horizontal'
    if (props.modelValue === true)
        return props.schema?.trueIcon
    if (!props.modelValue)
        return props.schema?.falseIcon
})

function cycleInput() {
    if (!props.modelValue) {
        modelObj.value = 'toggle'
    }
    else if (props.modelValue === 'toggle') {
        modelObj.value = true
    }
    else if (props.modelValue === true) {
        modelObj.value = false
    }
}

</script>

<style scoped>
.v-switch__track {
    width: 72px;
    display: flex;
}

.toggle-control-thumb-holder {
    position: absolute;
    transition: 0.15s transform cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-control {
    align-items: center;
    contain: layout;
    display: flex;
    flex: 1 0;
    grid-area: control;
    position: relative;
    user-select: none;
}

.toggle-control-wrapper {
    display: flex;
    align-items: center;
    position: relative;
    justify-content: center;
    flex: none;
    width: auto;
}

.track-section {
    flex: 1;
}

.toggle-control-on {
    transform: translateX(28px);
}

.toggle-control-off {
    transform: translateX(-28px);
}

.toggle-control-switch {
    transform: translateX(0px);
}
</style>