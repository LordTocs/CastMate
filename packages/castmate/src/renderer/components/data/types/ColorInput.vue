<template>
    <div class="d-flex flex-row">
        <v-menu :close-on-content-click="false" :contentProps="{ style: { minWidth: 'unset !important' }}">
            <template #activator="{ props }">
                <v-input v-model="modelObj" v-bind="props" :density="topProps.density">
                    <v-field :label="topProps.label" clearable :active="!!modelObj" style="cursor: pointer">
                        <div class="d-flex flex-row align-center preview">
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
    import { computed } from 'vue';
    import { useModel } from '../../../utils/modelValue';
    const topProps = defineProps({
        modelValue: {},
        label: { type: String },
        colorRefs: { },
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
    </script>
    
    <style scoped>
    .preview {
      min-height: 43px;
      margin-top: 20px;
      margin-inline-start: var(--v-field-padding-start);
    }
    
    .swatch {
        width: 30px;
        height: 30px;
        border-radius: 3px;
    }
    
    .ref-swatch {
        height: 30px;
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