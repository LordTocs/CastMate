<template>
    <p v-if="resourceItem">
        <span 
            class="text--secondary" 
            v-if="props.schema.name || props.label"
        >
			{{ props.schema.name || label }}: 
        </span>
        {{ resourceItem?.config?.name }}
    </p>
</template>

<script setup>
import { computed } from 'vue';
import { useResourceArray } from '../../../utils/resources';

const props = defineProps({
    modelValue: { type: String },
    schema: {},
    label: { type: String }
})

const resourceItems = useResourceArray(props.schema?.resourceType)

const resourceItem = computed(() => {
    return resourceItems.value?.find(i => i.id == props.modelValue)
})

</script>