<template>
  <v-text-field
    v-if="!schema.enum"
    :value="value"
    @input="(v) => $emit('input', v)"
    :label="schema.name || dataName"
  />
  <enum-input
    :value="value"
    v-else-if="schema.enum || schema.enumQuery"
    :enum="schema.enum || schema.enumQuery"
    :queryMode="!!schema.enumQuery"
    @input="(v) => $emit('input', v)"
    @change="(v) => $emit('change', v)"
    :label="schema.name || dataName"
  />
</template>

<script>
import EnumInput from "./EnumInput.vue";
export default {
  components: {
    EnumInput,
  },
  props: {
    value: {},
    schema: {},
    dataName: { type: String },
  },
};
</script>

<style>
</style>