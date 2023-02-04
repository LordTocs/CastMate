<template>
    <v-dialog v-model="dialog">
        <v-card>
            <v-toolbar dark dense flat>
                <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
                    {{ props.title }}
                </v-toolbar-title>
            </v-toolbar>
            <v-card-text>
                <data-input v-model="editData" :schema="discordHookResourceType.config"/>
            </v-card-text>
            <v-card-actions>
                <v-spacer/>
                <v-btn color="grey" @click="cancel"> Cancel </v-btn>
                <v-btn color="primary" @click="ok"> OK </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import DataInput from '../data/DataInput.vue';
import { useResourceFunctions, useResourceType } from '../../utils/resources';
import _cloneDeep from "lodash/cloneDeep"

const emit = defineEmits(['ok'])

const props = defineProps({
    title: { type: String }
})

const dialog = ref(false)
const editData = ref(null)

const discordhookResource = useResourceFunctions("discordhook")
const discordHookResourceType = useResourceType("discordhook")

async function open(hookId) {
    if (hookId) {
        console.log("Hook", await discordhookResource.getById(hookId))
        editData.value = _cloneDeep((await discordhookResource.getById(hookId))?.config)
    }
    else
    {
        editData.value = {}
    }
    dialog.value = true;
}

defineExpose( { open })

function cancel() {
    editData.value = null
    dialog.value = false
}

function ok() {
    emit('ok', editData.value)
    editData.value = null
    dialog.value = false
}

</script>