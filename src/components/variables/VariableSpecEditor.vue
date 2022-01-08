<template>
  <div>
    <v-text-field
      :value="variableName"
      @change="(v) => $emit('name', v)"
      label="Variable Name"
    />
    <v-select
      :value="value.type"
      @change="(v) => updateSubValue('type', v)"
      label="Variable Type"
      :items="[
        { name: 'Number', value: 'Number' },
        { name: 'Text', value: 'String' },
      ]"
      item-text="name"
      item-value="value"
    />
    <v-text-field
      :value="value.default"
      @change="(v) => updateSubValue('default', v)"
      label="Default Value"
      v-if="value.type == 'String'"
    />
    <number-input
      v-else
      :value="value.default"
      @input="(v) => updateSubValue('default', v)"
      label="Default Value"
    />
  </div>
</template>

<script>
import _cloneDeep from "lodash/cloneDeep";
import NumberInput from "../data/NumberInput.vue";
export default {
  components: { NumberInput },
  props: {
    variableName: { type: String },
    value: {},
  },
  methods: {
    updateSubValue(key, value) {
      const newValue = _cloneDeep(this.value);
      newValue[key] = value;
      this.$emit("input", newValue);
    },
  },
};
</script>

<style>
</style>