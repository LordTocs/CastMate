<template>
  <div class="d-flex flex-row justify-center">
    <div class="state-select mx-1">
      <state-selector
        v-model="state"
        label="State Value"
      />
    </div>
    <div class="operator-select mx-1">
      <v-select
        :items="operators"
        item-value="key"
        item-title="key"
        v-model="operator"
      >
        <template v-slot:item="{ item, props }">
          <v-list-item v-bind="props" class="d-flex flex-row justify-center py-1" title="">
            <v-icon :icon="item.raw.icon"/>
          </v-list-item>
        </template>
        <template v-slot:selection="{ item }">
          <v-icon :icon="item.raw.icon" size="small" />
        </template>
      </v-select>
    </div>
    <div class="state-select mx-1">
      <data-input
        v-if="stateSchema"
        v-model="compare"
        label="Compare Value"
        :schema="stateSchema"
      />
      <v-text-field
        v-model="compare"
        v-else
      />
    </div>
  </div>
</template>

<script>

import StateSelector from "../state/StateSelector.vue";
import _cloneDeep from "lodash/cloneDeep";
import DataInput from "../data/DataInput.vue";
import { mapGetters } from "vuex";
import { mapModelValues } from "../../utils/modelValue.js";
import { mapState } from "pinia";
import { useVariableStore } from "../../store/variables";
export default {
  props: {
    modelValue: {},
  },
  emits: ["update:modelValue"],
  components: { StateSelector, DataInput },
  computed: {
    ...mapGetters("ipc", ["plugins", "stateLookup"]),
    ...mapState(useVariableStore, {
        variables: store => store.variableSpecs
    }),
    ...mapModelValues(["state", "operator", "compare"]),
    operators() {
      return [
        {
          key: "lessThanEq",
          icon: "mdi-less-than-or-equal",
        },
        {
          key: "lessThan",
          icon: "mdi-less-than",
        },
        {
          key: "equal",
          icon: "mdi-equal",
        },
        {
          key: "notEqual",
          icon: "mdi-not-equal-variant",
        },
        {
          key: "greaterThan",
          icon: "mdi-greater-than",
        },
        {
          key: "greaterThanEq",
          icon: "mdi-greater-than-or-equal",
        },
      ];
    },
    stateSchema() {
      if (!this.modelValue || !this.modelValue.state) return undefined;

      let schema;
      const plugin = this.plugins[this.modelValue.state.plugin];
      if (plugin) schema = _cloneDeep(plugin.stateSchemas[this.modelValue.state.key]);
      if (!schema) schema = _cloneDeep(this.variables[this.modelValue.state.key]);
      if (schema) schema.required = true;

      return schema;
    },
    stateValue() {
      if (!this.modelValue || !this.modelValue.state) return undefined;
      return this.stateLookup[this.modelValue.state.plugin][this.modelValue.state.key];
    },
  },
};
</script>

<style scoped>
.operator-select {
  width: 4rem;
}

.state-select {
  flex: 1;
}

.input-aligned {
  padding-top: 20px;
  margin-top: 4px;
}
</style>