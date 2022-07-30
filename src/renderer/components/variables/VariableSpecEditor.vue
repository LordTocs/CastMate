<template>
  <div>
    <v-text-field
      label="Variable Name"
      v-model="name"
    />
    <v-select
      v-model="type"
      label="Variable Type"
      :items="[
        { name: 'Number', value: 'Number' },
        { name: 'Text', value: 'String' },
      ]"
      item-text="name"
      item-value="value"
    />
    <v-text-field
      v-if="value.type == 'String'"
      v-model="defaultValue"
      label="Default Value"
    />
    <number-input
      v-else
      v-model="defaultValue"
      label="Default Value"
    />
  </div>
</template>

<script>
import _cloneDeep from "lodash/cloneDeep";
import { mapModelValues } from "../../utils/modelValue";
import NumberInput from "../data/types/NumberInput.vue";
export default {
  components: { NumberInput },
  props: {
    variableName: { type: String },
    value: {},
  },
  computed: {
    ...mapModelValues(["name", "type"]),
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