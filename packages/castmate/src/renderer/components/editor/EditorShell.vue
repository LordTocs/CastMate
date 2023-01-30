<template>
<div class="editor-base">
    <div class="d-flex flex-grow-1 flex-column">
      <v-sheet color="grey-darken-4" class="py-4 px-4 d-flex">
        <div class="d-flex flex-column mx-4">
          <v-btn color="primary" icon="mdi-content-save" fab dark class="my-1 align-self-center" @click="saveInternal" :disabled="!props.dirty" />
          <slot name="belowSave"></slot>  
        </div>
        <div class="flex-grow-1">
            {{ props.name }}
          <slot name="header"></slot>
        </div>
      </v-sheet>
      <slot></slot>
    </div>
    <confirm-dialog ref="saveDlg" />
    <v-snackbar v-model="saveSnack" :timeout="1000" color="green">
      Saved
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import { onBeforeRouteLeave } from 'vue-router';
import ConfirmDialog from '../dialogs/ConfirmDialog.vue';

const props = defineProps({
    name: { type: String },
    dirty: { type: Boolean },
})

const saveSnack = ref(false)

const emit = defineEmits(["save"])

async function saveInternal() {
    emit('save')
    saveSnack.value = true
}

const saveDlg = ref(null)
onBeforeRouteLeave(async () => {
    if (props.dirty && await saveDlg.value.open(
        "Unsaved Changes",
        "Do you want to save your changes?",
        "Save Changes",
        "Discard Changes"
    )) {
        await saveInternal();
    }
    return true;
})

</script>

<style scoped>
.editor-base {
  display: flex;
  flex-direction: row;
  height: 100%;
}
</style>