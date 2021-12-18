<template>
  <div class="d-flex flex-row">
    <div class="state-select mx-1">
      <state-selector
        :value="value ? value.state : null"
        @input="(v) => updateSubValue('state', v)"
        label="State Value"
      />
    </div>
    <!--div class="state-display mx1">
      <v-text-field :value="stateValue" label="Current Value" readonly outlined disabled />
      <v-input class="input-aligned">
        {{ stateValue }}
      </v-input>
    </div-->
    <div class="operator-select mx-1">
      <v-select
        :items="operators"
        item-value="key"
        label="Operator"
        :value="value ? value.operator : null"
        @change="(v) => updateSubValue('operator', v)"
      >
        <template v-slot:item="{ item }">
          <v-icon> {{ item.icon }} </v-icon>
        </template>
        <template v-slot:selection="{ item }">
          <v-icon> {{ item.icon }} </v-icon>
        </template>
      </v-select>
    </div>
    <div class="state-select mx-1">
      <data-input
        v-if="stateSchema"
        :value="value.compare"
        @input="(v) => updateSubValue('compare', v)"
        label="Compare Value"
        :schema="stateSchema"
      />
      <v-text-field
        :value="value.compare"
        @input="(v) => updateSubValue('compare', v)"
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
export default {
  props: {
    value: {},
  },
  components: { StateSelector, DataInput },
  computed: {
    ...mapGetters("ipc", ["stateSchemas", "stateLookup"]),
    ...mapGetters("variables", ["variables"]),
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
      if (!this.value || !this.value.state) return undefined;

      let schema;
      if (this.stateSchemas[this.value.state.plugin])
        schema =
          this.stateSchemas[this.value.state.plugin][this.value.state.key];
      if (!schema) schema = this.variables[this.value.state.key];
      if (schema) schema.required = true;

      return schema;
    },
    stateValue() {
      if (!this.value || !this.value.state) return undefined;
      return this.stateLookup[this.value.state.plugin][this.value.state.key];
    },
  },
  methods: {
    updateSubValue(key, val) {
      const newValue = _cloneDeep(this.value);
      newValue[key] = val;
      this.$emit("input", newValue);
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