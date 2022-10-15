<template>
  <data-input
    v-model="modelObj"
    :schema="schema"
    :label="label"
    :context="modelObj"
  />
</template>

<script>
import { mapGetters } from "vuex";
import { mapModel } from "../../utils/modelValue";
import DataInput from "../data/DataInput.vue";

export default {
  props: {
    modelValue: {},
    plugin: { type: String },
    actionKey: { type: String },
  },
  emits: ["update:modelValue"],
  components: { DataInput },
  computed: {
    ...mapGetters("ipc", ["plugins"]),
    ...mapModel(),
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