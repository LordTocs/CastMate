<template>
  <v-combobox
    multiple
    chips
    closable-chips
    :label="label" 
    v-model="modelObj"
    prepend-icon="mdi-magnify"
    :density="density"
  >
  </v-combobox>
</template>

<script>
import { mapModel } from "../../utils/modelValue";
export default {
  props: {
    modelValue: {},
    label: { type: String, default: () => "Tags"},
    density: { type: String },
  },
  emits: ["update:modelValue"],
  computed: {
    ...mapModel(),
  }
};
</script>

<style>
</style>