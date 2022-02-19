<template>
  <trigger-table
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  >
    <template v-slot:label="labelProps">
      {{ labelProps.item.key }} → {{ getNextNumber(labelProps.item.key, labelProps.commandList) }}
    </template>
    <template v-slot:selector="selectProps">
      <number-input
        :value="selectProps.value"
        @input="selectProps.valueInput"
        label="Command"
        single-line
        counter
      />
    </template>
  </trigger-table>
</template>

<script>
import NumberInput from "../data/NumberInput.vue";
import TriggerTable from "./TriggerTable.vue";
export default {
  components: {
    TriggerTable,
    NumberInput,
  },
  props: {
    trigger: {},
    triggerKey: { type: String },
    value: {},
  },
  methods: {
    getNextNumber(key, list) {
      const numKey = Number(key);
      const idx = list.findIndex((v) => v.key == numKey);
      if (idx == -1) {
        return "error";
      }

      const next = list[idx + 1]?.key;

      return next || "∞";
    },
  },
};
</script>

<style>
</style>