<template>
  <div class="d-flex flex-row align-center">
    <number-input
      :label="`Min ${label}`"
      :value="value ? value.min : null"
      @input="(v) => setValue(v, 'min')"
    />
    <span class="mx-3">⟶</span>
    <number-input
      :label="`Max ${label}`"
      :value="value ? value.max : null"
      @input="(v) => setValue(v, 'max')"
    />
  </div>
</template>

<script>
import NumberInput from "./NumberInput.vue";
export default {
  props: {
    value: {},
    label: { type: String, default: () => "" },
  },
  components: { NumberInput },
  methods: {
    setValue(value, prop) {
      const newValue = { ...this.value };
      newValue[prop] = value;
      this.$emit("input", newValue);
    },
  },
};
</script>

<style scoped>
</style>