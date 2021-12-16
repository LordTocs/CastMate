<template>
  <v-sheet
    :class="{
      'boolean-group': true,
      'any-group': isAny,
      'all-group': isAll,
      'single-group': !isAny && !isAll,
      'my-2': true,
    }"
    v-if="value"
  >
    <div class="d-flex group-header">
      <div class="boolean-handle group-handle" v-if="hasHandle">
        <v-icon> mdi-drag </v-icon>
      </div>
      <div class="flex-grow-1 mx-3">
        <v-select
          v-if="isAll || isAny"
          :items="operations"
          :value="value.operator"
          @input="(v) => setSubValue('operator', v)"
        />
      </div>
      <v-btn
        icon
        @click="setOperand(value.operands.length, { operator: 'equal' })"
      >
        <v-icon> mdi-plus </v-icon>
      </v-btn>
      <v-btn
        icon
        @click="
          setOperand(value.operands.length, { operator: 'Any', operands: [] })
        "
      >
        <v-icon> mdi-plus </v-icon>
      </v-btn>
      <v-btn icon @click="$emit('delete')" v-if="hasHandle">
        <v-icon> mdi-close </v-icon>
      </v-btn>
    </div>
    <div class="group-content">
      <div v-for="(expr, i) in value.operands" :key="i">
        <boolean-group
          v-if="expr.operands"
          :value="expr"
          @input="(v) => setOperand(i, v)"
          @delete="(v) => deleteOperand(i)"
        />
        <boolean-expression
          v-else
          :value="expr"
          @input="(v) => setOperand(i, v)"
          @delete="(v) => deleteOperand(i)"
        />
      </div>
    </div>
  </v-sheet>
</template>

<script>
import _cloneDeep from "lodash/cloneDeep";
import BooleanExpression from "./BooleanExpression.vue";
export default {
  name: "BooleanGroup",
  props: {
    value: {},
    hasHandle: { type: Boolean, default: () => true },
  },
  components: {
    BooleanExpression,
  },
  computed: {
    operations() {
      return ["Any", "All"];
    },
    isAny() {
      return (
        this.value &&
        this.value.operator == "Any" &&
        this.value.operands.length > 1
      );
    },
    isAll() {
      return (
        this.value &&
        this.value.operator == "All" &&
        this.value.operands.length > 1
      );
    },
  },
  methods: {
    setSubValue(key, value) {
      const newValue = _cloneDeep(this.value);
      newValue[key] = value;
      this.$emit("input", newValue);
    },
    setOperand(index, value) {
      const newValue = _cloneDeep(this.value);
      if (!newValue.operands) {
        newValue.operands = [];
      }
      newValue.operands[index] = value;
      this.$emit("input", newValue);
    },
    deleteOperand(index) {
      const newValue = _cloneDeep(this.value);
      if (!newValue.operands) return;
      newValue.operands.splice(index, 1);
      this.$emit("input", newValue);
    },
  },
};
</script>

<style scoped>
.boolean-group {
  border-width: 2px;
  border-style: solid;
}

.group-header {
  margin: initial !important;
  padding: initial !important;
}

.group-handle {
  width: 20px;
}

.group-content {
  padding-left: 20px;
  padding-right: 5px;
}

.any-group {
  border-color: green !important;
}

.all-group {
  border-color: blue !important;
}

.any-group > .group-header {
  background-color: green;
}

.all-group > .group-header {
  background-color: blue;
}

.single-group > .group-header {
  background-color: #2f2f2f;
}
</style>