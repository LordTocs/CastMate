<template>
  <trigger-table
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  >
    <template v-slot:label="labelProps">
      {{ getDisplayString(labelProps.item.key) }}
    </template>
    <template v-slot:selector="selectProps">
      <timer-input :value="selectProps.value" @input="selectProps.valueInput" />
    </template>
    <template v-slot:new-selector="selectProps">
      <timer-input :value="selectProps.value" @input="selectProps.valueInput" />
    </template>
  </trigger-table>
</template>

<script>
import TriggerTable from "./TriggerTable.vue";
import { changeObjectKey } from "../../utils/objects";
import TimerInput from "../data/TimerInput.vue";

export default {
  components: { TriggerTable, TimerInput },
  props: {
    trigger: {},
    triggerKey: { type: String },
    value: {},
  },
  computed: {
    existingRewards() {
      return Object.keys(this.value);
    },
  },
  methods: {
    renameCommand(oldKey, newKey) {
      console.log("Renaming Command", oldKey, newKey);
      const result = changeObjectKey(this.value, oldKey, newKey);
      this.$emit("input", result);
    },
    getDisplayString(timerKey) {
      const [interval, offset] = timerKey.split("+");
      return "Every " + this.formatTimeStr(interval) + " after " + this.formatTimeStr(offset);
    },
    formatTimeStr(time) {
      const hours = Math.floor(time / (60 * 60));
      let remaining = time - hours * 60 * 60;
      const minutes = Math.floor(remaining / 60);
      remaining = remaining - minutes * 60;
      const seconds = Math.floor(remaining);

      if (hours > 0) {
        return (
          hours +
          ":" +
          String(minutes).padStart(2, "0") +
          ":" +
          String(seconds).padStart(2, "0")
        );
      } else {
        return (
          String(minutes).padStart(2, "0") +
          ":" +
          String(seconds).padStart(2, "0")
        );
      }
    },
  },
};
</script>

<style>
</style>