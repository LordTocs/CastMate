<template>
    <v-select
        :items="fonts || []"
        v-model="modelObj"
        @focus="refreshFonts"
        hide-details
        :label="props.label"
        :density="props.density"
    >
        <template #item="{ item, props}">
            <v-list-item v-bind="props" class="d-flex flex-row justify-center py-1" title="">
                <span :style="{ fontFamily: `${addQuotes(item.value)}`}" class="text-preview">{{item.value}}</span>
            </v-list-item>
        </template>
        <template #selection="{ item }" >
            <div class="text-no-wrap">
                <span :style="{ fontFamily: `${addQuotes(item.value)}`}" class="text-preview">{{item.value}}</span>
            </div>
        </template>
    </v-select>
</template>

<script setup>
import { ref } from 'vue';
import { useIpcFunc } from '../../../utils/ipcMap';
import { useModel } from '../../../utils/modelValue';

const getFonts = useIpcFunc('os', 'getFonts')

const props = defineProps({ 
    modelValue: { type: String },
    label: { type: String },
    density: { type: String },
})
const emit = defineEmits(['update:modelValue'])

const fonts = ref(null)

const modelObj = useModel(props, emit)

async function refreshFonts() {
    fonts.value = (await getFonts()).map(f => ({ title: f, value: f }))
}

function addQuotes(str) {
    return `"${str}"`
}



</script>

<style scoped>
.text-preview {
    color: white;
}
</style>
