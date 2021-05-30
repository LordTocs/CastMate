<template>
  <draggable
    :list="value"
    handle=".handle"
    tag="v-timeline"
    :component-data="getDraggableData()"
  >
    <!--v-timeline dense align-top-->
    <action-list-item
      v-for="(action, i) in value"
      :key="i"
      :value="action"
      @input="(v) => updateAction(i, v)"
      @delete="deleteAction(i)"
    />
  </draggable>
</template>

<script>
import ActionListItem from "./ActionListItem.vue";
import Draggable from "vuedraggable";
export default {
  components: { ActionListItem, Draggable },
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
      console.log("Changed", arr);
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
    }
  },
};
</script>

<style>
</style>