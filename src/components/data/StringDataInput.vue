<template>
  <v-text-field
    v-if="!schema.enum"
    :value="value"
    @input="(v) => $emit('input', v)"
    @copy.stop=""
    @paste.stop=""
    :label="schema.name || dataName"
    :clearable="!schema.required"
  />
  <enum-input
    :value="value"
    v-else-if="schema.enum || schema.enumQuery"
    :enum="schema.enum || schema.enumQuery"
    :queryMode="!!schema.enumQuery"
    @input="(v) => $emit('input', v)"
    @change="(v) => $emit('change', v)"
    :label="schema.name || dataName"
    :clearable="!schema.required"
    :context="context"
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
    context: {},
  },
};
</script>

<style>
</style>