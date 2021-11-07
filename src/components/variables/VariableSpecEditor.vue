<template>
  <v-card>
    <v-card-title>
      <v-text-field
        :value="variableName"
        @change="(v) => $emit('name', v)"
        label="Variable Name"
      />
    </v-card-title>
    <v-card-text>
      <v-select
        :value="value.type"
        @change="(v) => updateSubValue('type', v)"
        label="Variable Type"
        :items="[
          { name: 'Number', value: 'number' },
          { name: 'Text', value: 'string' },
        ]"
        item-text="name"
        item-value="value"
      />
      <v-text-field
        :value="value.default"
        @change="(v) => updateSubValue('default', v)"
        label="Default Value"
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn icon @click="$emit('delete')">
        <v-icon> mdi-cancel </v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import _cloneDeep from "lodash/cloneDeep";
export default {
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