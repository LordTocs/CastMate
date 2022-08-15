<template>
  <v-text-field
    :type="this.allowTemplate ? undefined : 'number'"
    :label="label"
    :value="value"
    @change="handleInput"
    :clearable="clearable"
    @copy.stop=""
    @paste.stop=""
    :placeholder="placeholder"
  >
    <template v-slot:append v-if="unit">
      {{ unit.name }}
    </template>
  </v-text-field>
</template>

<script>
export default {
  props: {
    value: {},
    label: {},
    unit: {},
    allowTemplate: { type: Boolean, default: () => false },
    clearable: { type: Boolean, default: () => false },
    placeholder: {},
  },
  methods: {
    handleInput(v) {
      if (v === null || String(v).trim() == "") {
        this.$emit("input", undefined);
        return;
      }
      let number = Number(v);

      if (isNaN(number) && this.allowTemplate) {
        this.$emit("input", v);
        return;
      } else if (!isNaN(number)) {
        this.$emit("input", number);
      }
    },
  },
};
</script>

<style>
</style>