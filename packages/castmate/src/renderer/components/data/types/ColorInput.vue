<template>
    <div class="d-flex flex-row">
        <v-menu :close-on-content-click="false" :contentProps="{ style: { minWidth: 'unset !important' }}">
            <template #activator="{ props }">
                <v-input v-model="modelObj" :density="topProps.density" >
                    <v-field 
                        :label="topProps.label"
                        :active="!!modelObj"
                        :dirty="!!modelObj"
                        :clearable="!schema?.required" 
                        @click:clear="doClear"
                    >
                        <div class="v-field__input" v-bind="props" style="cursor: pointer">
                            <div class="swatch" :style="{ backgroundColor: modelObj }" v-if="!isFixedColor"> </div>
                            <div class="ref-swatch" v-else> {{ modelObj.ref }}</div>
                        </div>
                        <template #append-inner v-if="topProps.colorRefs">
                            <v-tooltip v-for="colorRef in topProps.colorRefs" :text="colorRef">
                                <template #activator="{ props }">
                                    <v-btn size="x-small" v-bind="props" @click.stop="modelObj = {ref: colorRef}">
                                        {{ getInitials(colorRef) }}
                                    </v-btn>
                                </template>
                            </v-tooltip>
                        </template>
                    </v-field>
                </v-input>
            </template>
            <v-card class="mx-1 my-1">
                <v-color-picker v-model="sanitizedColor" />
            </v-card>
        </v-menu>
    </div>
    </template>
    
    <script setup>
    //d-flex flex-row align-center preview
    import { computed } from 'vue';
    import { useModel } from '../../../utils/modelValue';
    const topProps = defineProps({
        modelValue: {},
        label: { type: String },
        colorRefs: { },
        schema: {},
        density: { type: String },
    })
    const emit = defineEmits(['update:modelValue'])
    const modelObj = useModel(topProps ,emit);
    
    const isFixedColor = computed(() => {
        if (!(topProps.modelValue instanceof Object))
        {
            return false;
        }
    
        return !!topProps.modelValue.ref;
    })

    const sanitizedColor = computed({
        get: () => {
            if (isFixedColor.value)
                return null;
            return topProps.modelValue;
        },
        set: (value) => {
            modelObj.value = value;
        }
    })
    
    function getInitials(str) {
        return str[0].toUpperCase();
    }
    
    const refInitials = computed(() => {
        if (!isFixedColor.value)
            return null;
        return getInitials(topProps.modelValue.ref[0])
    })

    function doClear() {
        console.log("CLEAR!")
        modelObj.value = undefined
    }
    </script>
    
    <style scoped>
    .preview {
      min-height: 43px;
      margin-top: 20px;
      margin-inline-start: var(--v-field-padding-start);
    }
    
    .swatch {
        /*width: calc(var(--v-input-control-height) - (var(--v-field-padding-top, 10px) + var(--v-input-padding-top, 0)) - 8px);*/
        width: 100%;
        height: calc(var(--v-input-control-height) - (var(--v-field-padding-top, 10px) + var(--v-input-padding-top, 0)) - 8px);
        margin: 4px 0;
        border-radius: 3px;
    }

    .ref-swatch {
        width: 100%;
        height: calc(var(--v-input-control-height) - (var(--v-field-padding-top, 10px) + var(--v-input-padding-top, 0)) - 8px);
        border-radius: 3px;
        padding-left: 10px;
        padding-right: 10px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        background-image: linear-gradient(to right, #D654FF , #0860FF);
    }
    </style>