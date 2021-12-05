<template>
  <named-command-trigger
    v-if="trigger.type == 'CommandTrigger'"
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
  <number-command-trigger
    v-else-if="trigger.type == 'NumberTrigger'"
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
  <enum-command-trigger
    v-else-if="trigger.type == 'EnumTrigger'"
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
  <single-command-trigger
    v-else-if="trigger.type == 'SingleTrigger'"
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
</template>

<script>
import NumberCommandTrigger from "./NumberCommandTrigger.vue";
import SingleCommandTrigger from "./SingleCommandTrigger.vue";
import NamedCommandTrigger from "./NamedCommandTrigger.vue";
import EnumCommandTrigger from "./EnumCommandTrigger.vue";

export default {
  components: {
    SingleCommandTrigger,
    NamedCommandTrigger,
    NumberCommandTrigger,
    EnumCommandTrigger,
  },
  computed: {
    commands() {
      if (!this.value) {
        return [];
      }
      return Object.keys(this.value).filter((key) => key != "imports");
    },
  },
  props: {
    triggerKey: { type: String },
    trigger: {},
    value: {},
  },
};
</script>

<style>
.trigger-editor {
  text-align: left;
  background-color: #efefef;
}

.trigger-editor:not(:last-child) {
  margin-bottom: 1.5rem;
}

.command-editor {
  margin-bottom: 1rem;
}
</style>