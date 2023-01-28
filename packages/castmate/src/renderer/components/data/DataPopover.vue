<template>
    <v-menu v-model="modal" :close-on-content-click="false" location="center">
        <template #activator="{ props }">
            <data-view v-bind=" { ...viewProps, ...props}" :value="modelValue" :schema="schema" style="min-width: 40px; min-height: 40px;"/>
        </template>
        <v-card>
            <data-input v-model="localData" :schema="schema" label="Value" class="mx-3 my-3" />
            <v-card-actions>
                <v-spacer />
                <v-btn @click="accept" class="mx-1" color="success"> Accept </v-btn>
                <v-btn @click="cancel" class="mx-1"> Cancel </v-btn>
            </v-card-actions>
        </v-card>
    </v-menu>
</template>

<script>
import DataView from './DataView.vue'
import DataInput from './DataInput.vue'
import _cloneDeep from 'lodash/cloneDeep'
import { mapModel } from '../../utils/modelValue'

export default {
    props: {
        modelValue: {},
        schema: {},
        viewProps: {}
    },
    emits: ['update:modelValue'],
    components: { DataView, DataInput },
    computed: {
        ...mapModel()
    },
    data() {
        return {
            modal: false,
            localData: null,
        }
    },
    methods: {
        accept() {
            this.$emit('update:modelValue', this.localData);
            this.modal = false;
        },
        cancel() {
            this.modal = false;
        }
    },
    watch: {
        modal() {
            if (this.modal) {
                this.localData = _cloneDeep(this.modelValue);
            }
            else {
                this.localData = null;
            }

        }
    }
}
</script>