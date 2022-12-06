<template>
    <v-input v-model="modelObj">
        <v-field :label="label" clearable :active="!!props.modelValue" style="cursor: pointer" @click.stop="(dialog=true)">
            <div class="d-flex flex-row align-center preview">
                <span :style="previewFontStyle">{{ previewText }}</span>
            </div>
        </v-field>
    </v-input>
    <v-dialog persistent v-model="dialog">
        <v-card width="65vw">
            <v-toolbar dense flat>
                <v-toolbar-title class="font-weight-bold grey--text">
                {{ props.label }}
                </v-toolbar-title>
            </v-toolbar>
            <div class="px-4">
                <div class="text-preview">
                    <span :style="fontStyle">{{ previewText }}</span>
                </div>
                <font-input v-model="fontFamily" label="Font" />
                <number-input v-model="fontSize" label="Font Size" />
                <color-input v-model="fontColor" :color-refs="props.colorRefs" label="Font Color" />
                <div class="d-flex flex-row">
                    <font-stroke-input v-model="stroke" :color-refs="props.colorRefs" class="flex-grow-1 mr-2" />
                    <font-shadow-input v-model="shadow" :color-refs="props.colorRefs" class="flex-grow-1 ml-2"/>
                </div>
            </div>
            <v-card-actions>
                <v-spacer />
                <v-btn color="primary" @click="(dialog = false)"> Ok </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useModel, useModelValues } from '../../../utils/modelValue.js'
import NumberInput from './NumberInput.vue'
import FontInput from './FontInput.vue'
import ColorInput from './ColorInput.vue'
import FontStrokeInput from '../../text/FontStrokeInput.vue'
import _cloneDeep from 'lodash/cloneDeep'
import FontShadowInput from '../../text/FontShadowInput.vue'

const props = defineProps({
    modelValue: {},
    label: { type: String },
    colorRefs: {},
    schema: {}
})
const emit = defineEmits(["update:modelValue"])

const dialog = ref(null)

const modelObj = useModel(props, emit);
const { fontSize, fontColor, fontFamily, fontWeight, stroke, shadow } = useModelValues(props, emit, ['fontSize', 'fontColor', 'fontFamily', 'fontWeight', 'stroke', 'shadow'])

const fontStyle = computed(() => {
    const result = {};

    result.fontSize = `${fontSize.value}px`
    result.color = fontColor.value
    result.fontFamily = fontFamily.value
    result.fontWeight = fontWeight.value
    if (stroke.value && stroke.value.width > 0) {
        result['-webkit-text-stroke-color'] = stroke.value.color || "#000000"
        result['-webkit-text-stroke-width'] = `${stroke.value.width}px`
    }
    if (shadow.value) {
        result.textShadow = `${shadow.value.offsetX || 0}px ${shadow.value.offsetY || 0}px ${shadow.value.blur || 0}px ${shadow.value.color || "#000000"}`
    }

    return result;
})

const previewFontStyle = computed(() => {
    const result = _cloneDeep(fontStyle.value)
    result.fontSize = '16px'

    const ratio = 16.0 / (fontSize.value || 16);

    if (stroke.value) {
        result['-webkit-text-stroke-width'] = `${stroke.value.width * ratio}px`
    }

    if (shadow.value) {
        result.textShadow = `${(shadow.value.offsetX || 0) * ratio}px ${(shadow.value.offsetY || 0) * ratio}px ${(shadow.value.blur || 0) * ratio}px ${shadow.value.color || "#000000"}`
    }
    return result;
})

const previewText = computed(() => {
    if (props.schema.exampleText)
        return props.schema.exampleText
    return "Lorem Ipsum"
})
    

</script>

<style scoped>

.text-preview {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin: 10px;
}
.preview {
  min-height: 43px;
  margin-top: 20px;
  margin-left: 6px;
  margin-inline-start: var(--v-field-padding-start);
}
</style>