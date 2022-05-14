<template>
  <trigger-table
    v-if="!!trigger.config"
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
  <single-automation-trigger
    v-else-if="trigger.type == 'SingleTrigger'"
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
</template>

<script>
import TriggerTable from "./TriggerTable.vue";
import SingleAutomationTrigger from "./SingleAutomationTrigger.vue";

export default {
  components: {
    SingleAutomationTrigger,
    TriggerTable
  },
  props: {
    triggerKey: { type: String },
    trigger: {},
    value: {},
  },
};
</script>

<style>
</style>