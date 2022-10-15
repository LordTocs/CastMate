<template>
  <v-text-field
    v-model="modelObj"
    placeholder="hhhh:mm:ss"
    :label="label"
    v-maska="{ mask: ['#*:T#:T#', 'T#:T#', 'T#', '#'], tokens: { T: { pattern: /[0-6]/}}}"
  />
</template>

<script>
import { mapModel } from '../../../utils/modelValue';

export default {
  props: {
    modelValue: {},
    label: { type: String, default: () => "Time" },
  },
  emits: ['update:modelValue'],
  computed: {
    ...mapModel()
  }
};
</script>

<style>
</style>