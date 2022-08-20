<template>
  <div>
    <span class="label-span">
      {{ label }}
    </span>
    <div class="d-flex flex-row align-center">
      <number-input
        class="my-0 py-0"
        v-model.lazy="minValue"
        placeholder="−∞"
      />
      <span class="mx-3">⟶</span>
      <number-input
        class="my-0 py-0"
        v-model.lazy="maxValue"
        placeholder="∞"
      />
    </div>
  </div>
</template>

<script>
import NumberInput from "./NumberInput.vue";
export default {
  props: {
    modelValue: {},
    label: { type: String, default: () => "" },
  },
  emits: ["update:modelValue"],
  components: { NumberInput },
  computed: {
    minValue: {
      get() {
        return this.modelValue?.min;
      },
      set(newValue) {
        this.setModelValueProp("min", newValue);
      }
    },
    maxValue: {
      get() {
        return this.modelValue?.max;
      },
      set(newValue) {
        this.setModelValueProp("max", newValue);
      }
    },
  },
  methods: {
    setModelValueProp(prop, value) {
      const result = { ...this.modelValue };
      if (value === undefined)
      {
        delete result[prop];
      }
      else
      {
        result[prop] = value;
      }
      this.$emit("update:modelValue", result);
    }
  }
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