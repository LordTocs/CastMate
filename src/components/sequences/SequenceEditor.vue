<template>
  <div>
    <div style="display: flex; flex-direction: row">
      <div
        style="
          min-width: 96px;
          display: flex;
          flex-direction: row;
          justify-content: center;
        "
      >
        <v-btn @click="testSequence" color="primary">
          <v-icon> mdi-play </v-icon>
        </v-btn>
      </div>
    </div>
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
  </div>
</template>

<script>
import SequenceItem from "./SequenceItem.vue";
import Draggable from "vuedraggable";
import { ipcRenderer } from "electron";
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
    testSequence() {
      ipcRenderer.invoke("pushToQueue", this.value);
    },
  },
};
</script>

<style>
</style>