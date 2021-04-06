<template>
  <v-text-field
    v-if="!isNumber"
    :value="displayValue"
    :label="label"
    @focus="startEdit"
    @blur="endEdit"
    @input="(v) => changeValue(v)"
    @click.stop="(event) => event.stopPropagation()"
  />
  <number-input
    v-else
    :value="displayValue"
    :label="label"
    @focus="startEdit"
    @blur="endEdit"
    @input="(v) => changeValue(v)"
    @click.stop="(event) => event.stopPropagation()"
  />
</template>

<script>
import _ from "lodash";
import NumberInput from "./NumberInput.vue";

export default {
  components: { NumberInput },
  props: {
    value: {},
    label: {},
    isNumber: { type: Boolean, default: () => false },
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