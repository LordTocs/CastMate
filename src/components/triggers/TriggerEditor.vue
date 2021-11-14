<template>
  <named-command-trigger
    v-if="trigger.type == 'NameAction'"
    :trigger="trigger"
	:triggerKey="triggerKey"
    @input="(v) => $emit('input', v)"
  />
  <!--multi-command-trigger
    v-else-if="trigger.type == 'NumberAction'"
    :trigger="trigger"
	:triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  />
  <single-command-trigger
    v-else-if="trigger.type == 'SingleAction'"
    :trigger="trigger"
	:triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  /-->
</template>

<script>
import MultiCommandTrigger from "./MultiCommandTrigger.vue";
import SingleCommandTrigger from "./SingleCommandTrigger.vue";
import NamedCommandTrigger from "./NamedCommandTrigger.vue";

export default {
  components: {
    MultiCommandTrigger,
    SingleCommandTrigger,
    NamedCommandTrigger,
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