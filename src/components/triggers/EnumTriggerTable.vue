<template>
  <trigger-table
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  >
    <template v-slot:label="labelProps">
      {{ labelProps.item.key }}
    </template>
    <template v-slot:selector="selectProps">
      <enum-input
        :value="selectProps.value"
        @input="selectProps.valueInput"
        :label="trigger.triggerUnit || 'Command'"
        :enum="trigger.enum"
      />
    </template>
    <template v-slot:new-selector="selectProps">
      <enum-input
        :value="selectProps.value"
        @input="selectProps.valueInput"
        :label="selectProps.label"
        :enum="trigger.enum"
      />
    </template>
  </trigger-table>
</template>

<script>
import EnumInput from "../data/EnumInput.vue";
import TriggerTable from "./TriggerTable.vue";

export default {
  components: { TriggerTable, EnumInput },
  props: {
    trigger: {},
    triggerKey: { type: String },
    value: {},
  },
};
</script>

<style>
</style>