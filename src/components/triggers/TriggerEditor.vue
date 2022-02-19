<template>
  <command-trigger-table
    v-if="trigger.type == 'CommandTrigger'"
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
  <number-trigger-table
    v-else-if="trigger.type == 'NumberTrigger'"
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
  <enum-trigger-table
    v-else-if="trigger.type == 'EnumTrigger'"
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
  <reward-trigger-table
    v-else-if="trigger.type == 'RewardTrigger'"
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
</template>

<script>
import NumberTriggerTable from "./NumberTriggerTable.vue";
import SingleAutomationTrigger from "./SingleAutomationTrigger.vue";
import CommandTriggerTable from "./CommandTriggerTable.vue";
import EnumTriggerTable from "./EnumTriggerTable.vue";
import RewardTriggerTable from "./RewardTriggerTable.vue";

export default {
  components: {
    SingleAutomationTrigger,
    CommandTriggerTable,
    NumberTriggerTable,
    EnumTriggerTable,
    RewardTriggerTable,
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