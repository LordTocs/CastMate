<template>
  <v-text-field
    v-if="!schema.enum"
    v-model="modelObj"
    @copy.stop=""
    @paste.stop=""
    :label="schema.name || label"
    :clearable="!schema.required"
    :type="!secret ? 'text' : 'password'"
  />
  <enum-input
    v-else-if="schema.enum || schema.enumQuery"
    :enum="schema.enum || schema.enumQuery"
    :queryMode="!!schema.enumQuery"
    v-model="modelObj"
    :label="schema.name || label"
    :clearable="!schema.required"
    :context="context"
    :template="schema.template"
  />
</template>

<script>
import { mapModel } from "../../../utils/modelValue";
import EnumInput from "./EnumInput.vue";
export default {
  components: {
    EnumInput,
  },
  props: {
    modelValue: {},
    schema: {},
    label: { type: String },
    context: {},
    secret: { type: Boolean, default: () => false },
  },
  emits: ['update:modelValue'],
  computed: {
    ...mapModel()
  }
};
</script>

<style>
</style>