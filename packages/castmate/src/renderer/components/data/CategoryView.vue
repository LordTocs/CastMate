<template>
<div class="d-flex flex-row align-center" v-if="category">
    <v-avatar :image="category.boxArtUrl" rounded="0"/>
    <div class="flex-grow-1" v-if="!props.iconOnly">
        {{ category.name }}
    </div>
</div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useIpc } from '../../utils/ipcMap';

const props = defineProps({
    iconOnly: { type: Boolean, default: false },
    categoryId: { type: String }
})

const category = ref(null)

const getCategoryById = useIpc("twitch", "getCategoryById")

async function queryCategory() {
    if (!props.categoryId) {
        return
    }

    category.value = await getCategoryById(props.categoryId)
}

watch(() => props.categoryId, queryCategory)

onMounted(() => {
    queryCategory()
})

</script>