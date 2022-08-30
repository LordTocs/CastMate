<template>
    <v-card variant="outlined">
        <v-card-subtitle class="d-flex flex-row py-2 align-center">
            <div class="flex-grow-1 "> {{ label || 'No label' }} </div> 
            <v-btn icon="mdi-plus" @click="addItem" size="x-small" />
        </v-card-subtitle>
        <v-divider />
        <div class="my-2">
            <div class="d-flex flex-row mx-2 align-center" v-for="item,i in (modelValue || [])">
                <data-input :schema="itemSchema" :model-value="item" @update:model-value="(v) => updateItem(i, v)"  />
                <v-btn class="mx-2" icon="mdi-delete" @click="deleteItem(i)" size="x-small"/>
            </div>
        </div>
    </v-card>
</template>

<script>
import { constructDefaultSchema } from '../../../utils/objects';
import { defineAsyncComponent } from 'vue';
export default {
    name: 'array-input',
    props: {
        schema: {},
        modelValue: { type: Array },
        label: { type: String, default: () => ""}
    },
    emits: ['update:modelValue'],
    components: { DataInput: defineAsyncComponent(() => import("../DataInput.vue")) },
    computed: {
        itemSchema() {
            return this.schema?.items;
        }
    },
    methods: {
        updateItem(index, value) {
            const newValue = [...(this.modelValue || [])];
            newValue[index] = value;
            this.$emit("update:modelValue", newValue);
        },
        deleteItem(index) {
            const newValue = [...(this.modelValue || [])];
            newValue.splice(index, 1);
            this.$emit("update:modelValue", newValue);
        },
        addItem() {
            const newItem = constructDefaultSchema(this.itemSchema);
            const newValue = [...(this.modelValue || []), newItem];
            this.$emit("update:modelValue", newValue);
        }
    }
}
</script>

<style scoped>
</style>