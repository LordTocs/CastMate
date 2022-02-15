<template>
  <v-text-field
    :type="this.allowTemplate ? undefined : 'number'"
    :label="label"
    :value="value"
    @change="handleInput"
    :clearable="clearable"
    @copy.stop=""
    @paste.stop=""
  />
</template>

<script>
export default {
  props: {
    value: {},
    label: {},
    allowTemplate: { type: Boolean, default: () => false },
    clearable: { type: Boolean, default: () => false },
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