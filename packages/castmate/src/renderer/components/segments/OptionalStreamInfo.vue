<template>
    <v-card variant="outlined" class="px-4 py-2 mb-3" :class="{ 'invalid': !valid, 'valid': valid}">
        <div class="d-flex flex-row align-center mb-2">
            <span class="flex-grow-1" :class="{ 'text-disabled': !valid, 'text-medium-emphasis': valid}">
                Stream Info
            </span>
            <v-btn size="small" variant="flat" icon="mdi-close" @click="emit('update:modelValue', undefined)" />
        </div>
        <v-text-field v-model="title" label="Title" counter maxlength="140" :density="props.density" clearable />
        <category-search v-model="category" clearable />
        <tag-select v-model="tags" clearable />
    </v-card>
</template>

<script setup>
import { computed } from 'vue';
import CategorySearch from '../data/CategorySearch.vue';
import TagSelect from '../data/TagSelect.vue';

const props = defineProps({
    modelValue: {},
    density: { type: String }
})

const valid = computed(() => !!props.modelValue)

const emit = defineEmits(["update:modelValue"])

function emitNewValue(valueName, value) {
    const newInfo = { ...props.modelValue }

    console.log("Emitting New VAlue", valueName, value, newInfo )

    if (value && value.length > 0) {
        newInfo[valueName] = value
    } else {
        delete newInfo[valueName]
    }

    if (Object.keys(newInfo).length === 0) {
        emit("update:modelValue", undefined)
        return
    }

    emit("update:modelValue", newInfo)
}

const title = computed({
    get() {
        return props.modelValue?.title
    },
    set(newTitle) {
        emitNewValue("title", newTitle)
    }
})

const category = computed({
    get() {
        return props.modelValue?.category
    },
    set(newValue) {
        emitNewValue("category", newValue)
    }
})

const tags = computed({
    get() {
        return props.modelValue?.tags
    },
    set(newValue) {
        emitNewValue("tags", newValue)
    }
})

</script>

<style scoped>
.valid {
}

.invalid {
    border-color: rgba(var(--v-theme-on-background), var(--v-disabled-opacity)) !important;
}
</style>