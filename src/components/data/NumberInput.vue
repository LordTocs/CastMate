<template>
  <v-text-field
    :type="this.allowTemplate ? undefined : 'number'"
    :label="label"
    :value="value"
    @input="(v) => handleInput(v)"
  />
</template>

<script>
export default {
  props: {
    value: {},
    label: {},
    allowTemplate: { type: Boolean, default: () => false },
  },
  methods: {
    handleInput(v) {
      let number = Number(v);

      if (isNaN(number) && this.allowTemplate) {
        this.$emit("input", v);
        return;
      } else if (!isNaN(number)) {
        this.$emit('input', number);
      }
    },
  },
};
</script>

<style>
</style>