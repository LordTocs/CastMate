<template>
  <v-sheet
    :class="{
      'boolean-group': true,
      'any-group': isAny,
      'all-group': isAll,
      'single-group': !isAny && !isAll,
      'my-2': true,
      'rounded': true,
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
    <draggable
      :list="value.operands"
      class="group-content"
      handle=".boolean-handle"
      group="boolean-expressions"
      :component-data="getDraggableData()"
    >
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
    </draggable>
  </v-sheet>
</template>

<script>
import _cloneDeep from "lodash/cloneDeep";
import BooleanExpression from "./BooleanExpression.vue";
import Draggable from "vuedraggable";
export default {
  name: "BooleanGroup",
  props: {
    value: {},
    hasHandle: { type: Boolean, default: () => true },
  },
  components: {
    BooleanExpression,
    Draggable,
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
    dragChanged(newArray) {
      const newValue = _cloneDeep(this.value);
      newValue.operands = newArray;
      this.$emit("input", newValue);
    },
    getDraggableData() {
      return {
        on: {
          inputChanged: this.dragChanged,
        },
      };
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
  display: flex;
}

.group-content {
  padding-left: 20px;
  padding-right: 5px;
  min-height: 20px;
}

.any-group {
  border-color: #7CB342 !important;
}

.all-group {
  border-color: #0288D1 !important;
}

.single-group {
  border-color: #393939;
}

.any-group > .group-header {
  background-color: #7CB342;
}

.all-group > .group-header {
  background-color: #0288D1;
}

.single-group > .group-header {
  background-color: #393939;
}
</style>