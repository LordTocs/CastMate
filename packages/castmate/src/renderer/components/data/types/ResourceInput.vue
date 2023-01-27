<template>
    <v-select
        v-model="modelObj"
        :items="resourceItems"
        item-title="config.name"
        item-value="id"
        :label="props.label"
        clearable
        :density="props.density"
        :menu-props="{ maxHeight: 200, location: 'bottom' }"
    ></v-select>
</template>

<script setup>
import { useModel } from '../../../utils/modelValue.js'
import { useResourceArray } from '../../../utils/resources.js'

const props = defineProps({
    modelValue: {},
    schema: {},
    label: {},
    density: { type: String },
})

const emit = defineEmits(["update:modelValue"]);

const modelObj = useModel(props, emit)

const resourceItems = useResourceArray(props.schema.resourceType)
</script>

