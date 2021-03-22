<template>
  <div v-if="isEmpty">
    <empty-conditional :value="value" @input="(v) => $emit('input', v)" />
  </div>
  <div v-else-if="isAnd">
    <div v-for="(subConditional, i) in value.and" :key="i">
      <conditional-editor
        :value="subConditional"
        @input="(v) => updateSubCondition(i, v)"
      />
    </div>
  </div>
  <div v-else-if="isOr">
    <div v-for="(subConditional, i) in value.and" :key="i">
      <conditional-editor
        :value="subConditional"
        @input="(v) => updateSubCondition(i, v)"
      />
    </div>
    <div>
      <empty-conditional :value="null" @input="(v) => addSubCondition(v)" />
    </div>
  </div>
  <div v-else>
    <el-form-item label="State Name">
      <state-selector
        :value="stateName"
        @input="(v) => changeStateName(stateName, v)"
      />
    </el-form-item>
    <el-form-item label="Target Value" v-if="stateName">
      <el-input
        :value="stateValue"
        @input="(v) => changeStateValue(stateName, v)"
      />
    </el-form-item>
  </div>
</template>

<script>
import StateSelector from "../state/StateSelector.vue";
import EmptyConditional from "./EmptyConditional.vue";
import { changeObjectKey } from "../../utils/objects.js";
export default {
  name: "ConditionalEditor",
  props: {
    value: {},
  },
  components: {
    StateSelector,
    EmptyConditional,
  },
  computed: {
    isOr() {
      return "or" in this.value;
    },
    isAnd() {
      return "and" in this.value;
    },
    isNot() {
      return "not" in this.value;
    },
    isEmpty() {
      return !this.value;
    },
    stateName() {
      let keys = Object.keys(this.value);
      if (keys.length > 0) return keys[0];
      return null;
    },
    stateValue() {
      return this.value[this.stateName];
    },
  },
  methods: {
    updateSubCondition(index, subValue) {
      let newValue = {};
      let newArray = null;
      if (this.isOr) {
        newArray = [...this.value.or];
        newValue.or = newArray;
      } else if (this.isAnd) {
        newArray = [...this.value.and];
        newValue.or = newArray;
      }

      newArray[index] = subValue;

      this.$emit("input", newValue);
    },
    changeStateName(oldName, newName) {
      let newValue = null;

      if (oldName) {
        newValue = changeObjectKey(this.value, oldName, newName);
      } else {
        newValue = { [newName]: null };
      }

      this.$emit("input", newValue);
    },
    changeStateValue(key, value) {
      let newValue = { ...this.value };

      newValue[key] = value;

      this.$emit("input", newValue);
    },
  },
};
</script>

<style>
</style>