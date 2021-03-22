<template>
  <el-input
    :value="displayValue"
    @focus="startEdit"
    @blur="endEdit"
    @input="(v) => changeValue(v)"
  />
</template>

<script>
import _ from "lodash";

export default {
  props: {
    value: {},
  },
  data() {
    return {
      editing: false,
      editValue: null,
    };
  },
  computed: {
    displayValue() {
      return this.editing ? this.editValue : this.value;
    },
  },
  methods: {
    changeValue(newValue) {
      if (this.editing) {
        this.editValue = newValue;
      }
    },
    startEdit() {
      this.editValue = _.clone(this.value);
      this.editing = true;
    },
    endEdit() {
      this.$emit("input", this.editValue);
      this.editing = false;
      this.editValue = null;
    },
  },
};
</script>

<style>
</style>