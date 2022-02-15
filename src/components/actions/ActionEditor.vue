<template>
  <data-input
    :value="value"
    @input="(v) => $emit('input', v)"
    :schema="schema"
    :label="label"
    :context="value"
  />
</template>

<script>
import { mapGetters } from "vuex";
import DataInput from "../data/DataInput.vue";

export default {
  props: {
    value: {},
    plugin: { type: String },
    actionKey: { type: String },
  },
  components: { DataInput },
  computed: {
    ...mapGetters("ipc", ["plugins"]),
    actionSpec() {
      const plugin = this.plugins[this.plugin];
      return plugin.actions[this.actionKey];
    },
    label() {
      return this.actionSpec.name || this.actionKey;
    },
    schema() {
      return this.actionSpec.data;
    },
  },
};
</script>

<style>
.action-card {
  margin-bottom: 0.75rem;
}

.action-card-body {
  display: flex;
  flex-direction: row;
}
</style>