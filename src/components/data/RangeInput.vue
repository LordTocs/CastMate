<template>
  <div>
    <span class="label-span">
      {{ label }}
    </span>
    <div class="d-flex flex-row align-center">
      <number-input
        class="my-0 py-0"
        :value="value ? value.min : null"
        @input="(v) => setValue(v, 'min')"
        placeholder="−∞"
      />
      <span class="mx-3">⟶</span>
      <number-input
        class="my-0 py-0"
        :value="value ? value.max : null"
        @input="(v) => setValue(v, 'max')"
        placeholder="∞"
      />
    </div>
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
.label-span {
  display: inline-block;
  position: relative;
  line-height: 15px;
  font-size: 12px;
  min-height: 6px;
  bottom: -6px;
}
</style>