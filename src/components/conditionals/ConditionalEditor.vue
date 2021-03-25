<template>
  <div v-if="isEmpty">
    <empty-conditional :value="value" @input="(v) => $emit('input', v)" />
  </div>
  <div class="array-div" v-else-if="isAnd">
    <div class="array-header">And</div>
    <div class="array-container">
      <conditional-editor
        v-for="(subConditional, i) in value.and"
        :key="i"
        :value="subConditional"
        @input="(v) => updateSubCondition(i, v)"
        @delete="deleteSubCondition(i)"
      />
      <empty-conditional :value="null" @input="(v) => addSubCondition(v)" />
    </div>
    <el-button @click="$emit('delete')" icon="el-icon-delete" />
  </div>
  <div class="array-div" v-else-if="isOr">
    <div class="array-header">Or</div>
    <div class="array-container">
      <conditional-editor
        v-for="(subConditional, i) in value.or"
        :value="subConditional"
        :key="i"
        @input="(v) => updateSubCondition(i, v)"
        @delete="deleteSubCondition(i)"
      />
      <empty-conditional :value="null" @input="(v) => addSubCondition(v)" />
    </div>
    <el-button @click="$emit('delete')" icon="el-icon-delete" />
  </div>
  <div class="array-div" v-else-if="isNot">
    <div class="array-header">Not</div>
    <div class="array-container">
      <conditional-editor
        :value="value.not"
        @input="(v) => changeStateValue('not', v)"
        @delete="(v) => changeStateValue('not', null)"
      />
    </div>
    <div style="flex: 0; margin-bottom: 18px; margin-left: 5px">
      <el-button @click="$emit('delete')" icon="el-icon-delete" />
    </div>
  </div>
  <div class="value-div" v-else>
    <el-form-item label="State Name">
      <state-selector
        :value="stateName"
        @input="(v) => changeStateName(stateName, v)"
        @delete="deleteSubCondition(i)"
      />
    </el-form-item>
    <el-form-item label="Target Value" v-if="stateName" style="flex: 1">
      <el-input
        :value="stateValue"
        @input="(v) => changeStateValue(stateName, v)"
      />
    </el-form-item>
    <div style="flex: 0; margin-bottom: 18px; margin-left: 5px">
      <el-button @click="$emit('delete')" icon="el-icon-delete" />
    </div>
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
        newValue.and = newArray;
      }

      newArray[index] = subValue;

      this.$emit("input", newValue);
    },
    deleteSubCondition(index) {
      let newValue = {};
      let newArray = null;
      if (this.isOr) {
        newArray = [...this.value.or];
        newValue.or = newArray;
      } else if (this.isAnd) {
        newArray = [...this.value.and];
        newValue.and = newArray;
      }

      newArray.splice(index, 1);

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
    addSubCondition(subCondition) {
      let newValue = {};
      let newArray = null;
      if (this.isOr) {
        newArray = [...this.value.or];
        newValue.or = newArray;
      } else if (this.isAnd) {
        newArray = [...this.value.and];
        newValue.and = newArray;
      }
      newArray.push(subCondition);
      this.$emit("input", newValue);
    },
  },
};
</script>

<style scope>
.value-div {
  display: flex;
  flex-direction: row;
  flex: 1;
}

.array-div {
  display: flex;
  flex-direction: row;
}

.array-header {
  display: flex;
  flex-direction: column;
  justify-content: center;

  border: 2px solid #dbdbdb;
  border-right: 0px;

  margin-right: 1rem;
  margin-bottom: 18px;
  padding-left: 18px;
}

.array-container {
  flex: 1;
  margin-right: 0.5rem;
}
</style>