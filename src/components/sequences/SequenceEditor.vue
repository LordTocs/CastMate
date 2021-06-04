<template>
  <draggable
    :list="value"
    handle=".handle"
    tag="v-timeline"
    :component-data="getDraggableData()"
  >
    <sequence-item
      v-for="(action, i) in value"
      :key="i"
      :value="action"
      @input="(v) => updateAction(i, v)"
      @delete="deleteAction(i)"
    />
  </draggable>
</template>

<script>
import SequenceItem from "./SequenceItem.vue";
import Draggable from "vuedraggable";
export default {
  components: { SequenceItem, Draggable },
  props: {
    value: {},
  },
  methods: {
    getDraggableData() {
      return {
        on: {
          change: this.changed,
        },
        attrs: {
          dense: true,
          "align-top": true,
        },
      };
    },
    changed(arr) {
      this.$emit("input", arr);
    },
    updateAction(index, value) {
      let newValue = [...this.value];

      newValue[index] = value;

      this.$emit("input", newValue);
    },
    deleteAction(index) {
      let newValue = [...this.value];

      newValue.splice(index, 1);

      this.$emit("input", newValue);
    },
    newActionGroup() {
      let newValue = [...this.value, {}];

      this.$emit("input", newValue);
    },
  },
};
</script>

<style>
</style>