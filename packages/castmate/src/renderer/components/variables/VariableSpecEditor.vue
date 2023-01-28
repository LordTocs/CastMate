<template>
  <div>
    <v-text-field
      label="Variable Name"
      v-model="modelName"
    />
    <v-select
      v-model="type"
      label="Variable Type"
      :items="[
        { name: 'Number', value: 'Number' },
        { name: 'Text', value: 'String' },
      ]"
      item-title="name"
      item-value="value"
    />
    <v-text-field
      v-if="modelValue.type == 'String'"
      v-model="defaultValue"
      label="Default Value"
    />
    <number-input
      v-else
      v-model="defaultValue"
      label="Default Value"
    />
    <v-checkbox v-model="serialized" label="Saved" />
  </div>
</template>

<script>
import _cloneDeep from "lodash/cloneDeep";
import { mapModel, mapModelValues } from "../../utils/modelValue";
import NumberInput from "../data/types/NumberInput.vue";
export default {
  components: { NumberInput },
  props: {
    name: { type: String },
    modelValue: {},
  },
  emits: ["update:modelValue", "update:name"],
  computed: {
    ...mapModelValues(["type", "serialized"]),
    ...mapModel("name", "modelName"),
    defaultValue: {
      get() {
        return this.modelValue.default;
      },
      set(newValue) {
        const result = _cloneDeep(this.modelValue);
        result.default = newValue;
        this.$emit('update:modelValue', result);
      }
    }
  }
};
</script>

<style>
</style>