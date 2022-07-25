<template>
  <v-sheet
    :class="{
      'boolean-group': true,
      'any-group': isAny,
      'all-group': isAll,
      'single-group': !isAny && !isAll,
      'my-2': true,
      rounded: true,
    }"
    v-if="modelValue"
  >
    <div class="d-flex group-header">
      <div class="boolean-handle group-handle" v-if="hasHandle">
        <v-icon> mdi-drag </v-icon>
      </div>
      <div class="flex-grow-1 mx-3">
        <v-select
          v-if="isAll || isAny"
          :items="operations"
          item-value="key"
          item-title="text"
          :model-value="modelValue.operator"
          @update:model-value="(v) => setSubValue('operator', v)"
        />
      </div>
      <div class="d-flex flex-column mx-3">
        <v-btn
          small
          :class="{ 'my-1': true, 'light-green': isAny, 'light-blue': isAll, 'darken-4': true }"
          @click="setOperand(modelValue.operands.length, { operator: 'equal' })"
        >
          <v-icon> mdi-plus </v-icon> Add Value
        </v-btn>
        <v-btn
          small
          :class="{ 'my-1': true, 'light-green': isAny, 'light-blue': isAll, 'darken-4': true }"
          @click="
            setOperand(modelValue.operands.length, { operator: 'any', operands: [] })
          "
        >
          <v-icon> mdi-format-list-group </v-icon> Add Group
        </v-btn>
      </div>
      <v-btn icon @click="$emit('delete')" v-if="hasHandle">
        <v-icon> mdi-close </v-icon>
      </v-btn>
    </div>
    <!--draggable
      :list="modelValue.operands"
      class="group-content"
      handle=".boolean-handle"
      group="boolean-expressions"
      :component-data="getDraggableData()"
    -->
      <div v-for="(expr, i) in modelValue.operands" :key="i">
        <boolean-group
          v-if="expr.operands"
          :modelValue="expr"
          @update:modelValue="(v) => setOperand(i, v)"
          @delete="(v) => deleteOperand(i)"
        />
        <boolean-expression
          v-else
          :modelValue="expr"
          @update:modelValue="(v) => setOperand(i, v)"
          @delete="(v) => deleteOperand(i)"
        />
      </div>
    <!--/draggable-->
  </v-sheet>
</template>

<script>
import _cloneDeep from "lodash/cloneDeep";
import BooleanExpression from "./BooleanExpression.vue";
import Draggable from "vuedraggable";
export default {
  name: "BooleanGroup",
  props: {
    modelValue: {},
    hasHandle: { type: Boolean, default: () => true },
  },
  components: {
    BooleanExpression,
    Draggable,
  },
  computed: {
    operations() {
      return [
        {
          key: "all",
          text: "All - All conditions must be met"
        },
        {
          key: "any",
          text: "Any - Only one condition must be met"
        },
      ]
    },
    isAny() {
      return (
        this.modelValue &&
        this.modelValue.operator == "any" &&
        this.modelValue.operands.length > 1
      );
    },
    isAll() {
      return (
        this.modelValue &&
        this.modelValue.operator == "all" &&
        this.modelValue.operands.length > 1
      );
    },
  },
  methods: {
    setSubValue(key, value) {
      const newValue = _cloneDeep(this.modelValue);
      newValue[key] = value;
      this.$emit("update:modelValue", newValue);
    },
    setOperand(index, value) {
      const newValue = _cloneDeep(this.modelValue);
      if (!newValue.operands) {
        newValue.operands = [];
      }
      newValue.operands[index] = value;
      this.$emit("update:modelValue", newValue);
    },
    deleteOperand(index) {
      const newValue = _cloneDeep(this.modelValue);
      if (!newValue.operands) return;
      newValue.operands.splice(index, 1);
      this.$emit("update:modelValue", newValue);
    },
    dragChanged(newArray) {
      const newValue = _cloneDeep(this.modelValue);
      newValue.operands = newArray;
      this.$emit("update:modelValue", newValue);
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
  padding-right: 20px;
  min-height: 35px;
}

.any-group {
  border-color: #7cb342 !important;
}

.all-group {
  border-color: #0288d1 !important;
}

.single-group {
  border-color: #393939;
}

.any-group > .group-header {
  background-color: #7cb342;
}

.all-group > .group-header {
  background-color: #0288d1;
}

.single-group > .group-header {
  background-color: #393939;
}
</style>