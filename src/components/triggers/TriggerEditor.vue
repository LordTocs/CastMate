<template>
  <multi-command-trigger
    v-if="trigger.type == 'NameAction' || trigger.type == 'NumberAction'"
    :trigger="trigger"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
  <single-command-trigger
    v-else-if="trigger.type == 'SingleAction'"
    :trigger="trigger"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
</template>

<script>
import MultiCommandTrigger from "./MultiCommandTrigger.vue";
import SingleCommandTrigger from "./SingleCommandTrigger.vue";

export default {
  components: { MultiCommandTrigger, SingleCommandTrigger },
  computed: {
    commands() {
      if (!this.value) {
        return [];
      }
      return Object.keys(this.value).filter((key) => key != "imports");
    },
  },
  props: {
    value: {},
    triggerKey: { type: String },
    trigger: {},
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