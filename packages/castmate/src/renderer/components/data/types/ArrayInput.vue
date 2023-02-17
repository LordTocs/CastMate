<template>
    <v-card variant="outlined" class="my-2">
        <v-card-subtitle class="d-flex flex-row py-2 align-center">
            <div class="flex-grow-1 "> {{ label || 'No label' }} </div> 
            <v-btn icon="mdi-plus" @click="addItem" size="x-small" elevation="0"/>
        </v-card-subtitle>
        <v-divider />
        <div class="my-2">
            <draggable v-model="modelObj" handle=".array-handle" :item-key="getItemIndex">
                <template #item="{element, index}">
                    <v-card class="d-flex flex-row mx-2 my-2 align-stretch" elevation="2">
                        <div class="array-handle">
                            <v-icon size="large" class="mx-2"> mdi-drag </v-icon>
                        </div>
                        <div class="flex-grow-1">
                            <data-input 
                                :schema="itemSchema" 
                                :model-value="element" 
                                @update:model-value="(v) => updateItem(index, v)"
                                :density="density"
                                :secret="secret"
                                :context="context"
                            />
                        </div>
                        <div class="d-flex flex-column align-center">
                            <v-btn class="mx-2" icon="mdi-delete" @click="deleteItem(index)" size="x-small" elevation="0"/>
                            <v-btn class="mx-2" icon="mdi-content-copy" @click="duplicateItem(index)" size="x-small" elevation="0"/>
                        </div>
                    </v-card>
                </template>
            </draggable>
        </div>
    </v-card>
</template>

<script>
import { constructDefaultSchema } from '../../../utils/objects';
import { defineAsyncComponent } from 'vue';
import Draggable from "vuedraggable";
import { mapModel } from "../../../utils/modelValue";
import _cloneDeep from "lodash/cloneDeep"
export default {
    name: 'array-input',
    props: {
        schema: {},
        modelValue: { type: Array },
        label: { type: String, default: () => ""},
        density: { type: String },
        secret: { type: Boolean, default: false },
        context: { type: Object },
    },
    emits: ['update:modelValue'],
    components: { DataInput: defineAsyncComponent(() => import("../DataInput.vue")), Draggable },
    computed: {
        modelObj: {
            get() {
                return this.modelValue || [];
            },
            set(newValue) {
                this.$emit(`update:modelValue`, newValue);
            }
        },
        itemSchema() {
            return this.schema?.items;
        }
    },
    methods: {
        getItemIndex(item) {
            return this.modelValue?.indexOf(item)
        },
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
        duplicateItem(index) {
            const newValue = [...(this.modelValue || [])];
            console.log("Duplicating", index, newValue[index])
            const newItem = _cloneDeep(newValue[index]);
            newValue.splice(index, 0, newItem)
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
.array-handle {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
    cursor: grab;
}
</style>